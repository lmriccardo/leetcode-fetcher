"""
QUESTION TITLE: Find Eventual Safe States
QUESTION LINK: https://leetcode.com/problems/find-eventual-safe-states
QUESTION TAGS: Depth-First Search, Breadth-First Search, Graph, Topological Sort
QUESTION LEVEL: Medium
"""

from typing import *

# SOLUTION STARTS
class Solution:
    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:
        
        ...

# TESTS
print(Solution().eventualSafeNodes([[1,2],[2,3],[5],[0],[5],[],[]]))
print(Solution().eventualSafeNodes([[1,2,3,4],[1,2],[3,4],[0,4],[]]))
