
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Utensils, Receipt, Dumbbell, Calendar, Camera } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import CommentsSection from "./CommentsSection";

interface DetailedCaptureViewProps {
  participantId: string;
  captureType: 'food_entry' | 'workout' | 'receipt';
  captureId: string;
  onBack: () => void;
}

const DetailedCaptureView = ({ participantId, captureType, captureId, onBack }: DetailedCaptureViewProps) => {
  const [captureData, setCaptureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaptureData();
  }, [captureId, captureType]);

  const fetchCaptureData = async () => {
    try {
      setLoading(true);
      
      let data, error;
      
      // Handle each capture type separately to avoid dynamic table name issues
      if (captureType === 'food_entry') {
        const response = await backendApi
          .from('food_entries')
          .select('*')
          .eq('id', captureId)
          .eq('user_id', participantId)
          .single();
        data = response.data;
        error = response.error;
      } else if (captureType === 'workout') {
        const response = await backendApi
          .from('workouts')
          .select('*')
          .eq('id', captureId)
          .eq('user_id', participantId)
          .single();
        data = response.data;
        error = response.error;
      } else if (captureType === 'receipt') {
        const response = await backendApi
          .from('app_receipts')
          .select('*')
          .eq('id', captureId)
          .eq('user_id', participantId)
          .single();
        data = response.data;
        error = response.error;
      }

      if (error) throw error;
      setCaptureData(data);
    } catch (error) {
      console.error('Error fetching capture data:', error);
      toast.error('Failed to load capture details');
    } finally {
      setLoading(false);
    }
  };

  const getCaptureIcon = () => {
    switch (captureType) {
      case 'food_entry': return <Utensils className="h-6 w-6" />;
      case 'workout': return <Dumbbell className="h-6 w-6" />;
      case 'receipt': return <Receipt className="h-6 w-6" />;
    }
  };

  const getCaptureTitle = () => {
    switch (captureType) {
      case 'food_entry': return captureData?.description || 'Food Entry';
      case 'workout': return `${captureData?.workout_type || 'Unknown'} Workout`;
      case 'receipt': return `Receipt from ${captureData?.vendor || 'Unknown'}`;
    }
  };

  const renderCaptureDetails = () => {
    if (!captureData) return null;

    switch (captureType) {
      case 'food_entry':
        return (
          <div className="space-y-4">
            {captureData.image_url && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Image
                </h4>
                <img 
                  src={captureData.image_url} 
                  alt="Food" 
                  className="w-full max-w-md rounded-lg border"
                />
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Nutrition Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{captureData.calories || 0}</div>
                  <div className="text-sm text-green-700">Calories</div>
                </div>
                {captureData.extracted_nutrients && (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {captureData.extracted_nutrients.protein || 0}g
                      </div>
                      <div className="text-sm text-blue-700">Protein</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {captureData.extracted_nutrients.carbs || 0}g
                      </div>
                      <div className="text-sm text-yellow-700">Carbs</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {captureData.extracted_nutrients.fat || 0}g
                      </div>
                      <div className="text-sm text-purple-700">Fat</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {captureData.ingredients && (
              <div>
                <h4 className="font-medium mb-2">Ingredients</h4>
                <div className="space-y-2">
                  {Object.entries(captureData.ingredients).map(([ingredient, amount]) => (
                    <div key={ingredient} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="capitalize">{ingredient}</span>
                      <Badge variant="outline">{amount as string}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'workout':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {captureData.duration || 0}
                </div>
                <div className="text-sm text-purple-700">Minutes</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {captureData.calories_burned || 0}
                </div>
                <div className="text-sm text-orange-700">Calories Burned</div>
              </div>
            </div>

            {captureData.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="p-3 bg-gray-50 rounded-lg">{captureData.notes}</p>
              </div>
            )}
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-4">
            {captureData.image_url && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Receipt Image
                </h4>
                <img 
                  src={captureData.image_url} 
                  alt="Receipt" 
                  className="w-full max-w-md rounded-lg border"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${captureData.total_amount || 0}
                </div>
                <div className="text-sm text-green-700">Total Amount</div>
              </div>
              {captureData.receipt_date && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {new Date(captureData.receipt_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-blue-700">Date</div>
                </div>
              )}
            </div>

            {captureData.items && (
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {captureData.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{item.name}</span>
                      <div className="text-right">
                        <div className="font-medium">${item.price}</div>
                        {item.quantity && <div className="text-sm text-gray-500">Qty: {item.quantity}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {captureData.tags && captureData.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {captureData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading capture details...</div>;
  }

  if (!captureData) {
    return <div className="flex items-center justify-center h-64">Capture not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            {getCaptureIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getCaptureTitle()}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(captureData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Capture Details</CardTitle>
              <CardDescription>
                Detailed information about this {captureType.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCaptureDetails()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <CommentsSection 
            participantId={participantId}
            contentType={captureType}
            contentId={captureId}
            isCaretaker={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedCaptureView;
