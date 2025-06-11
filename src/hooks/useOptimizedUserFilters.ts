
import { useState, useMemo } from "react";
import { UserUsageData } from "@/types/userAnalytics";

export const useOptimizedUserFilters = (allUsers: UserUsageData[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState("totalAnalyses-desc");

  console.log('🔍 UserFilters: Input users count:', allUsers.length);

  // Use useMemo for expensive filtering operations
  const filteredUsers = useMemo(() => {
    console.log('🔄 UserFilters: Starting filter process with', allUsers.length, 'users');
    
    if (allUsers.length === 0) {
      console.log('⚠️ UserFilters: No users to filter');
      return [];
    }

    let filtered = [...allUsers];
    console.log('✅ UserFilters: Initial filtered array:', filtered.length);

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      console.log('🔍 UserFilters: Applying search filter:', search);
      
      const beforeSearch = filtered.length;
      filtered = filtered.filter(user => {
        const emailMatch = user.email.toLowerCase().includes(search);
        const nameMatch = (user.full_name || '').toLowerCase().includes(search);
        return emailMatch || nameMatch;
      });
      
      console.log(`🔍 UserFilters: Search filtered ${beforeSearch} → ${filtered.length} users`);
    }

    // Apply active only filter
    if (showActiveOnly) {
      console.log('👥 UserFilters: Applying active only filter');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const beforeActive = filtered.length;
      filtered = filtered.filter(user => {
        const isActive = user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo;
        return isActive;
      });
      
      console.log(`👥 UserFilters: Active filtered ${beforeActive} → ${filtered.length} users`);
    }

    // Apply sorting
    console.log('📊 UserFilters: Applying sort:', sortBy);
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

    console.log('✅ UserFilters: Final filtered result:', filtered.length, 'users');
    console.log('📋 UserFilters: Filtered users:', filtered.map(u => u.email));

    return filtered;
  }, [allUsers, searchTerm, showActiveOnly, sortBy]);

  const clearFilters = () => {
    console.log('🔄 UserFilters: Clearing all filters');
    setSearchTerm("");
    setShowActiveOnly(false);
    setSortBy("totalAnalyses-desc");
  };

  const hasActiveFilters = showActiveOnly || searchTerm.length > 0;

  console.log('🎯 UserFilters: Returning', filteredUsers.length, 'filtered users from', allUsers.length, 'total');

  return {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    showActiveOnly,
    setShowActiveOnly,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters
  };
};
