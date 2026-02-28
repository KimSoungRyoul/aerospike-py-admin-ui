from __future__ import annotations

import logging
import tempfile
import time
from pathlib import Path

from fastapi import APIRouter

from aerospike_cluster_manager_api.constants import POLICY_WRITE
from aerospike_cluster_manager_api.dependencies import AerospikeClient
from aerospike_cluster_manager_api.lua_modules import get_lua_modules
from aerospike_cluster_manager_api.models.sample_data import CreateSampleDataRequest, CreateSampleDataResponse
from aerospike_cluster_manager_api.sample_data_generator import SAMPLE_INDEXES, generate_record_bins

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sample-data", tags=["sample-data"])


@router.post(
    "/{conn_id}",
    status_code=201,
    summary="Create sample data set",
    description="Generate deterministic sample records with optional secondary indexes and UDF registration.",
)
async def create_sample_data(
    body: CreateSampleDataRequest,
    client: AerospikeClient,
) -> CreateSampleDataResponse:
    start = time.monotonic()
    ns = body.namespace
    set_name = body.set_name
    count = body.record_count

    # 1. Insert records
    records_created = 0
    for i in range(1, count + 1):
        key_tuple = (ns, set_name, i)
        bins = generate_record_bins(i)
        await client.put(key_tuple, bins, policy=POLICY_WRITE)
        records_created += 1

    # 2. Create secondary indexes (if requested)
    indexes_created: list[str] = []
    indexes_skipped: list[str] = []
    if body.create_indexes:
        for idx_name, bin_name, idx_type in SAMPLE_INDEXES:
            try:
                if idx_type == "numeric":
                    await client.index_integer_create(ns, set_name, bin_name, idx_name)
                elif idx_type == "string":
                    await client.index_string_create(ns, set_name, bin_name, idx_name)
                elif idx_type == "geo2dsphere":
                    await client.index_geo2dsphere_create(ns, set_name, bin_name, idx_name)
                indexes_created.append(idx_name)
            except Exception as exc:
                # aerospike_py 0.0.1 has a bug where IndexFoundError is not properly mapped
                # and surfaces as a generic ClientError with "IndexFound" in the message.
                # Catch both the mapped and unmapped variants.
                if "IndexFound" in str(exc) or "already exists" in str(exc):
                    indexes_skipped.append(idx_name)
                    logger.info("Index %s already exists, skipping", idx_name)
                else:
                    raise

    # 3. Register UDFs (if requested)
    udfs_registered: list[str] = []
    if body.register_udfs:
        for filename, content in get_lua_modules().items():
            tmp_path: str | None = None
            try:
                with tempfile.NamedTemporaryFile(mode="w", suffix=".lua", delete=False) as tmp:
                    tmp.write(content)
                    tmp.flush()
                    tmp_path = tmp.name
                await client.udf_put(tmp_path)
                udfs_registered.append(filename)
            finally:
                if tmp_path:
                    Path(tmp_path).unlink(missing_ok=True)

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return CreateSampleDataResponse(
        records_created=records_created,
        indexes_created=indexes_created,
        indexes_skipped=indexes_skipped,
        udfs_registered=udfs_registered,
        elapsed_ms=elapsed_ms,
    )
