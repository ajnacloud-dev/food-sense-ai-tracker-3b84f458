
import { useState, useMemo } from "react";
import { UserUsageData } from "@/types/userAnalytics";

export const useOptimizedUserFilters = (allUsers: UserUsageData[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState("totalAnalyses-desc");

  console.log('🔍 UserFilters: Input users count:', allUsers.length);
  console.log('👥 UserFilters: Input user emails:', allUsers.map(u => u.email));

  // Use useMemo for expensive filtering operations
  const filteredUsers = useMemo(() => {
    console.log('🔄 UserFilters: Starting filter process with', allUsers.length, 'users');
    console.log('📝 UserFilters: Input users detailed:', allUsers.map(u => ({ 
      email: u.email, 
      id: u.id, 
      total: u.totalAnalyses,
      lastActive: u.lastActive 
    })));
    
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

    // Apply active only filter - THIS IS THE LIKELY CULPRIT
    if (showActiveOnly) {
      console.log('👥 UserFilters: Applying active only filter');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('📅 UserFilters: Active filter cutoff date:', thirtyDaysAgo.toISOString());
      
      const beforeActive = filtered.length;
      filtered = filtered.filter(user => {
        const isActive = user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo;
        console.log(`🔍 User ${user.email}: lastActive=${user.lastActive}, isActive=${isActive}`);
        return isActive;
      });
      
      console.log(`👥 UserFilters: Active filtered ${beforeActive} → ${filtered.length} users`);
    } else {
      console.log('👥 UserFilters: NOT applying active only filter (showActiveOnly is false)');
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
    console.log('📋 UserFilters: Filtered users:', filtered.map(u => ({ email: u.email, total: u.totalAnalyses })));

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
  console.log('📋 Final filtered emails:', filteredUsers.map(u => u.email));
  console.log('🎛️ UserFilters: Filter state:', { searchTerm, showActiveOnly, sortBy, hasActiveFilters });

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
