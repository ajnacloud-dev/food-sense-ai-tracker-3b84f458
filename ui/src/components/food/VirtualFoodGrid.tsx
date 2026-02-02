import React, { useCallback, useRef, forwardRef } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { FoodCardOptimized } from './FoodCardOptimized';

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fats: number;
  total_fiber: number;
  total_sodium: number;
  meal_type: string;
  image_url: string;
  created_at: string;
  extracted_nutrients: any;
  user_id: string;
}

interface VirtualFoodGridProps {
  entries: FoodEntry[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  getMealTypeFromEntry: (entry: FoodEntry) => string;
  height?: number;
  width?: number;
}

// Cell renderer component
const Cell = ({
  columnIndex,
  rowIndex,
  style,
  data
}: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: any;
}) => {
  const { entries, columns, onView, onDelete, getMealTypeFromEntry } = data;
  const index = rowIndex * columns + columnIndex;
  const entry = entries[index];

  if (!entry) {
    return <div style={style} />;
  }

  return (
    <div style={{ ...style, padding: '8px' }}>
      <FoodCardOptimized
        entry={entry}
        onView={onView}
        onDelete={onDelete}
        getMealTypeFromEntry={getMealTypeFromEntry}
      />
    </div>
  );
};

// Custom scrollbar component for better UX
const CustomScrollbar = forwardRef<HTMLDivElement>((props, ref) => (
  <div
    ref={ref}
    className="custom-scrollbar"
    style={{
      ...props.style,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}
    {...props}
  />
));

CustomScrollbar.displayName = 'CustomScrollbar';

export const VirtualFoodGrid: React.FC<VirtualFoodGridProps> = ({
  entries,
  loading,
  hasMore,
  loadMore,
  onView,
  onDelete,
  getMealTypeFromEntry,
  height = 800,
  width = 1200
}) => {
  const gridRef = useRef<Grid>(null);

  // Calculate grid dimensions based on viewport
  const getColumnCount = useCallback((containerWidth: number) => {
    const minCardWidth = 280; // Minimum width for each card
    const padding = 16; // Padding between cards
    return Math.max(1, Math.floor(containerWidth / (minCardWidth + padding)));
  }, []);

  const columns = getColumnCount(width);
  const rowCount = Math.ceil(entries.length / columns);

  // Variable size callbacks for responsive grid
  const getColumnWidth = useCallback((index: number) => {
    const padding = 16;
    const totalPadding = padding * (columns + 1);
    return (width - totalPadding) / columns;
  }, [columns, width]);

  const getRowHeight = useCallback((index: number) => {
    return 380; // Fixed height for food cards
  }, []);

  // Infinite scroll logic
  const isItemLoaded = useCallback((index: number) => {
    return index < entries.length;
  }, [entries.length]);

  const loadMoreItems = useCallback(async () => {
    if (!loading && hasMore) {
      await loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Determine how many items to render (add buffer for smooth scrolling)
  const itemCount = hasMore ? entries.length + columns * 2 : entries.length;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
      minimumBatchSize={columns * 2}
      threshold={2}
    >
      {({ onItemsRendered, ref }) => (
        <Grid
          ref={(grid) => {
            ref(grid);
            gridRef.current = grid;
          }}
          className="virtual-food-grid"
          columnCount={columns}
          columnWidth={getColumnWidth}
          height={height}
          rowCount={Math.ceil(itemCount / columns)}
          rowHeight={getRowHeight}
          width={width}
          itemData={{
            entries,
            columns,
            onView,
            onDelete,
            getMealTypeFromEntry
          }}
          onItemsRendered={(gridData) => {
            const { visibleRowStartIndex, visibleRowStopIndex, visibleColumnStartIndex, visibleColumnStopIndex } = gridData;

            // Convert grid coordinates to list indices
            const visibleStartIndex = visibleRowStartIndex * columns + visibleColumnStartIndex;
            const visibleStopIndex = visibleRowStopIndex * columns + visibleColumnStopIndex;

            onItemsRendered({
              visibleStartIndex,
              visibleStopIndex
            });
          }}
          outerElementType={CustomScrollbar}
        >
          {Cell}
        </Grid>
      )}
    </InfiniteLoader>
  );
};

// Table view with virtual scrolling
export const VirtualFoodTable: React.FC<VirtualFoodGridProps> = ({
  entries,
  loading,
  hasMore,
  loadMore,
  onView,
  onDelete,
  getMealTypeFromEntry,
  height = 600,
  width = 1200
}) => {
  const TableRow = ({ index, style, data }: any) => {
    const entry = data.entries[index];

    if (!entry) {
      if (data.hasMore && index === data.entries.length) {
        return (
          <div style={style} className="flex items-center justify-center p-4">
            <div className="text-gray-500">Loading more...</div>
          </div>
        );
      }
      return <div style={style} />;
    }

    const calories = entry.extracted_nutrients?.meal_summary?.total_nutrition?.calories ||
                    entry.extracted_nutrients?.calories ||
                    entry.calories || 0;

    return (
      <div
        style={style}
        className="flex items-center border-b border-gray-200 hover:bg-gray-50 px-4 cursor-pointer"
        onClick={() => data.onView(entry.id)}
      >
        <div className="flex-1 py-3">
          <div className="font-medium text-gray-900">{entry.description || 'Food Entry'}</div>
          <div className="text-sm text-gray-500">
            {new Date(entry.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="px-4 text-center">
          <div className="text-sm font-medium text-orange-600">{Math.round(calories)} cal</div>
        </div>
        <div className="px-4 text-center">
          <div className="text-sm text-gray-600">{Math.round(entry.total_protein || 0)}g P</div>
        </div>
        <div className="px-4 text-center">
          <div className="text-sm text-gray-600">{Math.round(entry.total_carbohydrates || 0)}g C</div>
        </div>
        <div className="px-4 text-center">
          <div className="text-sm text-gray-600">{Math.round(entry.total_fats || 0)}g F</div>
        </div>
        <div className="px-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(entry.id);
            }}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const isItemLoaded = (index: number) => index < entries.length;

  const loadMoreItems = useCallback(async () => {
    if (!loading && hasMore) {
      await loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const itemCount = hasMore ? entries.length + 10 : entries.length;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Table header */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-700">
        <div className="flex-1">Food Item</div>
        <div className="px-4 text-center w-24">Calories</div>
        <div className="px-4 text-center w-20">Protein</div>
        <div className="px-4 text-center w-20">Carbs</div>
        <div className="px-4 text-center w-20">Fat</div>
        <div className="px-4 w-20">Actions</div>
      </div>

      {/* Virtual list */}
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={height}
            itemCount={itemCount}
            itemSize={60}
            width={width}
            onItemsRendered={onItemsRendered}
            itemData={{
              entries,
              hasMore,
              onView,
              onDelete,
              getMealTypeFromEntry
            }}
          >
            {TableRow}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

// Missing import - add this
import { FixedSizeList as List } from 'react-window';