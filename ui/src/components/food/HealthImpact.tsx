
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface HealthImpactProps {
  extractedNutrients: any;
}

export const HealthImpact = ({ extractedNutrients }: HealthImpactProps) => {
  const healthAssessment = extractedNutrients?.health_assessment || {};
  const nutritionFocus = extractedNutrients?.nutrition_focus || {};

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': case 'good': return 'bg-green-100 text-green-700 border-green-200';
      case 'moderate': case 'fair': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'poor': case 'bad': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const hasHealthData = healthAssessment.diabetes || healthAssessment.hypertension;
  const hasNutritionData = nutritionFocus.nutrients_high?.length > 0 || nutritionFocus.nutrients_low?.length > 0;

  if (!hasHealthData && !hasNutritionData && !nutritionFocus.suggestion) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Health Analysis Available</p>
            <p className="text-sm">Health impact data will appear here when available from the AI analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Assessments */}
      {hasHealthData && (
        <div className="grid md:grid-cols-2 gap-6">
          {healthAssessment.diabetes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-orange-600" />
                  Diabetes Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={`${getRatingColor(healthAssessment.diabetes.rating)} border`}>
                  {healthAssessment.diabetes.rating}
                </Badge>
                <p className="text-sm text-gray-700">{healthAssessment.diabetes.suggestion}</p>
              </CardContent>
            </Card>
          )}

          {healthAssessment.hypertension && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-red-600" />
                  Hypertension Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={`${getRatingColor(healthAssessment.hypertension.rating)} border`}>
                  {healthAssessment.hypertension.rating}
                </Badge>
                <p className="text-sm text-gray-700">{healthAssessment.hypertension.suggestion}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Nutrient Analysis */}
      {hasNutritionData && (
        <div className="grid md:grid-cols-2 gap-6">
          {nutritionFocus.nutrients_high?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  High Nutrients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nutritionFocus.nutrients_high.map((nutrient: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {nutrient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {nutritionFocus.nutrients_low?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  Low Nutrients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nutritionFocus.nutrients_low.map((nutrient: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                      {nutrient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* General Suggestions */}
      {nutritionFocus.suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutrition Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{nutritionFocus.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
