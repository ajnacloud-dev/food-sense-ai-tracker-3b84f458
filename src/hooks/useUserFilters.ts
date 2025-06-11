
import { useState, useEffect } from "react";
import { UserUsageData } from "@/types/userAnalytics";

export const useUserFilters = (allUsers: UserUsageData[]) => {
  const [filteredUsers, setFilteredUsers] = useState<UserUsageData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState("totalAnalyses-desc");

  // Filter and sort users whenever filters change
  useEffect(() => {
    let filtered = [...allUsers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active only filter
    if (showActiveOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(user => 
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalAnalyses-desc':
          return b.totalAnalyses - a.totalAnalyses;
        case 'totalAnalyses-asc':
          return a.totalAnalyses - b.totalAnalyses;
        case 'todayAnalyses-desc':
          return b.todayAnalyses - a.todayAnalyses;
        case 'email-asc':
          return a.email.localeCompare(b.email);
        case 'email-desc':
          return b.email.localeCompare(a.email);
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return b.totalAnalyses - a.totalAnalyses;
      }
    });

    setFilteredUsers(filtered);
    console.log('UserUsageAnalytics: Filtered users:', filtered.length, 'from', allUsers.length, 'total');
  }, [allUsers, searchTerm, showActiveOnly, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setShowActiveOnly(false);
    setSortBy("totalAnalyses-desc");
  };

  return {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    showActiveOnly,
    setShowActiveOnly,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters: showActiveOnly || searchTerm.length > 0
  };
};
