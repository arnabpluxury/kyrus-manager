use crate::models::TreemapNode;
use crate::storage::path_size;
use rayon::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};

pub fn build_treemap(root: &str, max_children: usize, max_depth: usize) -> Result<TreemapNode, String> {
    let path = PathBuf::from(root);
    if !path.exists() {
        return Err(format!("Path does not exist: {root}"));
    }
    Ok(build_node(&path, max_children, max_depth, 0))
}

fn build_node(path: &Path, max_children: usize, max_depth: usize, depth: usize) -> TreemapNode {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    let is_dir = path.is_dir();

    if !is_dir || depth >= max_depth {
        let size = if is_dir {
            path_size(&path.to_string_lossy())
        } else {
            fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        };
        return TreemapNode {
            name,
            path: path.to_string_lossy().to_string(),
            size_bytes: size,
            is_dir,
            children: vec![],
        };
    }

    let children_paths: Vec<PathBuf> = fs::read_dir(path)
        .map(|rd| rd.filter_map(|e| e.ok()).map(|e| e.path()).collect())
        .unwrap_or_default();

    let mut children: Vec<TreemapNode> = children_paths
        .par_iter()
        .map(|p| build_node(p, max_children, max_depth, depth + 1))
        .collect();

    children.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    children.truncate(max_children.max(1));
    let size_bytes = children.iter().map(|c| c.size_bytes).sum();

    TreemapNode {
        name,
        path: path.to_string_lossy().to_string(),
        size_bytes,
        is_dir: true,
        children,
    }
}
