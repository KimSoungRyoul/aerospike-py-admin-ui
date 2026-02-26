"""Kubernetes API client for managing AerospikeCECluster custom resources.

Uses the official kubernetes-client with asyncio.to_thread() wrappers
to avoid blocking the event loop (same pattern as client_manager.py).
"""

from __future__ import annotations

import asyncio
import logging
import threading
from typing import Any

logger = logging.getLogger(__name__)

# CRD constants
GROUP = "acko.io"
VERSION = "v1alpha1"
PLURAL = "aerospikececlusters"


class K8sClient:
    """Singleton wrapper around kubernetes CustomObjectsApi and CoreV1Api."""

    def __init__(self) -> None:
        self._custom_api = None
        self._core_api = None
        self._storage_api = None
        self._lock = threading.Lock()
        self._initialized = False

    def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            from kubernetes import client
            from kubernetes import config as k8s_config

            try:
                k8s_config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes config")
            except k8s_config.ConfigException:
                k8s_config.load_kube_config()
                logger.info("Loaded kubeconfig from default location")

            self._custom_api = client.CustomObjectsApi()
            self._core_api = client.CoreV1Api()
            self._storage_api = client.StorageV1Api()
            self._initialized = True

    # ------------------------------------------------------------------
    # Sync helpers
    # ------------------------------------------------------------------

    def _list_clusters_sync(self, namespace: str | None = None) -> list[dict[str, Any]]:
        self._ensure_initialized()
        if namespace:
            result = self._custom_api.list_namespaced_custom_object(
                group=GROUP, version=VERSION, namespace=namespace, plural=PLURAL
            )
        else:
            result = self._custom_api.list_cluster_custom_object(group=GROUP, version=VERSION, plural=PLURAL)
        return result.get("items", [])

    def _get_cluster_sync(self, namespace: str, name: str) -> dict[str, Any]:
        self._ensure_initialized()
        return self._custom_api.get_namespaced_custom_object(
            group=GROUP, version=VERSION, namespace=namespace, plural=PLURAL, name=name
        )

    def _create_cluster_sync(self, namespace: str, body: dict[str, Any]) -> dict[str, Any]:
        self._ensure_initialized()
        return self._custom_api.create_namespaced_custom_object(
            group=GROUP, version=VERSION, namespace=namespace, plural=PLURAL, body=body
        )

    def _patch_cluster_sync(self, namespace: str, name: str, body: dict[str, Any]) -> dict[str, Any]:
        self._ensure_initialized()
        return self._custom_api.patch_namespaced_custom_object(
            group=GROUP, version=VERSION, namespace=namespace, plural=PLURAL, name=name, body=body
        )

    def _delete_cluster_sync(self, namespace: str, name: str) -> dict[str, Any]:
        self._ensure_initialized()
        return self._custom_api.delete_namespaced_custom_object(
            group=GROUP, version=VERSION, namespace=namespace, plural=PLURAL, name=name
        )

    def _list_namespaces_sync(self) -> list[str]:
        self._ensure_initialized()
        result = self._core_api.list_namespace()
        return [ns.metadata.name for ns in result.items]

    def _list_storage_classes_sync(self) -> list[str]:
        self._ensure_initialized()
        result = self._storage_api.list_storage_class()
        return [sc.metadata.name for sc in result.items]

    def _list_pods_sync(self, namespace: str, label_selector: str) -> list[dict[str, Any]]:
        self._ensure_initialized()
        result = self._core_api.list_namespaced_pod(namespace=namespace, label_selector=label_selector)
        pods = []
        for pod in result.items:
            ready = False
            if pod.status and pod.status.conditions:
                for cond in pod.status.conditions:
                    if cond.type == "Ready" and cond.status == "True":
                        ready = True
                        break
            pods.append(
                {
                    "name": pod.metadata.name,
                    "podIP": pod.status.pod_ip if pod.status else None,
                    "hostIP": pod.status.host_ip if pod.status else None,
                    "isReady": ready,
                    "phase": pod.status.phase if pod.status else "Unknown",
                    "image": pod.spec.containers[0].image if pod.spec and pod.spec.containers else None,
                }
            )
        return pods

    # ------------------------------------------------------------------
    # Async public API
    # ------------------------------------------------------------------

    async def list_clusters(self, namespace: str | None = None) -> list[dict[str, Any]]:
        return await asyncio.to_thread(self._list_clusters_sync, namespace)

    async def get_cluster(self, namespace: str, name: str) -> dict[str, Any]:
        return await asyncio.to_thread(self._get_cluster_sync, namespace, name)

    async def create_cluster(self, namespace: str, body: dict[str, Any]) -> dict[str, Any]:
        return await asyncio.to_thread(self._create_cluster_sync, namespace, body)

    async def patch_cluster(self, namespace: str, name: str, body: dict[str, Any]) -> dict[str, Any]:
        return await asyncio.to_thread(self._patch_cluster_sync, namespace, name, body)

    async def delete_cluster(self, namespace: str, name: str) -> dict[str, Any]:
        return await asyncio.to_thread(self._delete_cluster_sync, namespace, name)

    async def list_namespaces(self) -> list[str]:
        return await asyncio.to_thread(self._list_namespaces_sync)

    async def list_storage_classes(self) -> list[str]:
        return await asyncio.to_thread(self._list_storage_classes_sync)

    async def list_pods(self, namespace: str, label_selector: str) -> list[dict[str, Any]]:
        return await asyncio.to_thread(self._list_pods_sync, namespace, label_selector)


k8s_client = K8sClient()
