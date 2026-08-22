import math
from typing import Dict, Any, List, Tuple
import numpy as np

class MorphometricFeatureEngineering:
    """Feature engineering pipeline for 3D anatomical landmarks and 54-edge morphometric graph."""

    @staticmethod
    def compute_graph_features(
        landmarks: Dict[str, Dict[str, float]],
        edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compute geometrical invariants and morphometric descriptors from the 54-edge graph."""
        coords = np.array([[v["X"], v["Y"], v["Z"]] for v in landmarks.values()]) if landmarks else np.empty((0, 3))
        
        if len(coords) == 0:
            return {"total_edges": len(edges)}

        centroid = np.mean(coords, axis=0)
        bounding_box = {
            "min": coords.min(axis=0).tolist(),
            "max": coords.max(axis=0).tolist(),
            "span_x": float(coords[:, 0].max() - coords[:, 0].min()),
            "span_y": float(coords[:, 1].max() - coords[:, 1].min()),
            "span_z": float(coords[:, 2].max() - coords[:, 2].min())
        }

        # Mechanical Axis vector (Hip Centre to Knee Centre)
        hip = landmarks.get("HIP CENTRE", {})
        knee = landmarks.get("FEMUR KNEE CENTRE", {})
        ma_length = 0.0
        if hip and knee:
            ma_vec = np.array([knee["X"] - hip["X"], knee["Y"] - hip["Y"], knee["Z"] - hip["Z"]])
            ma_length = float(np.linalg.norm(ma_vec))

        # Trans-Epicondylar Axis (TEA) vector
        med_epi = landmarks.get("MEDIAL EPICONDYLE", {})
        lat_epi = landmarks.get("LATERAL EPICONDYLE", {})
        tea_length = 0.0
        if med_epi and lat_epi:
            tea_vec = np.array([lat_epi["X"] - med_epi["X"], lat_epi["Y"] - med_epi["Y"], lat_epi["Z"] - med_epi["Z"]])
            tea_length = float(np.linalg.norm(tea_vec))

        # Edge statistics
        edge_lengths = [e.get("length_mm", 0.0) for e in edges if "length_mm" in e]
        mean_edge = float(np.mean(edge_lengths)) if edge_lengths else 0.0
        max_edge = float(np.max(edge_lengths)) if edge_lengths else 0.0
        min_edge = float(np.min(edge_lengths)) if edge_lengths else 0.0

        return {
            "centroid": centroid.tolist(),
            "bounding_box": bounding_box,
            "mechanical_axis_length_mm": ma_length,
            "trans_epicondylar_axis_length_mm": tea_length,
            "aspect_ratio_ma_to_tea": round(ma_length / max(tea_length, 1.0), 3),
            "edge_count": len(edges),
            "mean_edge_length_mm": round(mean_edge, 2),
            "max_edge_length_mm": round(max_edge, 2),
            "min_edge_length_mm": round(min_edge, 2)
        }
