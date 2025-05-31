
import { NavigateFunction } from "react-router-dom";

export const navigateToCategory = (navigate: NavigateFunction, category: string, entryId?: string) => {
  switch (category) {
    case 'food':
      navigate(entryId ? `/food/${entryId}` : '/food');
      break;
    case 'receipt':
      navigate(entryId ? `/receipts/${entryId}` : '/receipts');
      break;
    case 'workout':
      navigate(entryId ? `/workouts/${entryId}` : '/workouts');
      break;
    default:
      navigate('/dashboard');
  }
};
