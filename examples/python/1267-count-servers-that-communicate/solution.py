"""
QUESTION TITLE: Count Servers that Communicate
QUESTION LINK: https://leetcode.com/problems/count-servers-that-communicate
QUESTION TAGS: Array, Depth-First Search, Breadth-First Search, Union Find, Matrix, Counting
QUESTION LEVEL: Medium
"""

from typing import *

# SOLUTION STARTS
class Solution:
    def countServers(self, grid: List[List[int]]) -> int:
        
        ...

# TESTS
print(Solution().countServers([[1,0],[0,1]]))
print(Solution().countServers([[1,0],[1,1]]))
print(Solution().countServers([[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]))
