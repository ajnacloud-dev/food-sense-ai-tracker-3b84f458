
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface HealthImpactProps {
  extractedNutrients: any;
}

export const HealthImpact = ({ extractedNutrients }: HealthImpactProps) => {
  const healthData = extractedNutrients?.health_assessment || {};
  const nutritionAnalysis = extractedNutrients?.nutrition_analysis || {};

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': case 'good': return 'bg-green-100 text-green-700 border-green-200';
      case 'moderate': case 'fair': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'poor': case 'bad': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Assessments */}
      <div className="grid md:grid-cols-2 gap-6">
        {healthData.diabetes_rating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-5 w-5 text-orange-600" />
                Diabetes Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={`${getRatingColor(healthData.diabetes_rating)} border`}>
                {healthData.diabetes_rating}
              </Badge>
              <p className="text-sm text-gray-700">{healthData.diabetes_suggestion}</p>
            </CardContent>
          </Card>
        )}

        {healthData.hypertension_rating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-5 w-5 text-red-600" />
                Hypertension Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={`${getRatingColor(healthData.hypertension_rating)} border`}>
                {healthData.hypertension_rating}
              </Badge>
              <p className="text-sm text-gray-700">{healthData.hypertension_suggestion}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Nutrient Analysis */}
      {(nutritionAnalysis.nutrients_high?.length > 0 || nutritionAnalysis.nutrients_low?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {nutritionAnalysis.nutrients_high?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  High Nutrients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nutritionAnalysis.nutrients_high.map((nutrient: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {nutrient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {nutritionAnalysis.nutrients_low?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  Low Nutrients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nutritionAnalysis.nutrients_low.map((nutrient: string, index: number) => (
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
      {healthData.general_suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Health Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{healthData.general_suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
