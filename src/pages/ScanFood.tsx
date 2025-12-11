"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Layout } from "@/components/layout/Layout"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/shared/FileUpload"
import CameraCapture from "@/components/shared/CameraCapture"
import { RecipeCard } from "@/components/shared/RecipeCard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Sparkles, Check, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { scanFood, generateRecipe, type Recipe, type DetectedIngredient } from "@/lib/api/culinary-ai"

const ScanFood: React.FC = () => {
  const cameraRef = useRef<any>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dishName, setDishName] = useState("")
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([])
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [inputMode, setInputMode] = useState<"upload" | "camera">("upload")

  const [cameraStatus, setCameraStatus] = useState("Camera idle")

  // Stop camera when switching away from camera tab
  useEffect(() => {
    if (inputMode !== "camera" && cameraRef.current) {
      setCameraStatus("Camera stopped")
    }
  }, [inputMode])

  const handleFileSelect = async (file: File) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setPreview(base64)
      await analyzeImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = async (imageBase64: string) => {
    setPreview(imageBase64)
    await analyzeImage(imageBase64)
  }

  const handleClear = () => {
    setPreview(null)
    setDetectedIngredients([])
    setDishName("")
    setRecipe(null)
  }

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true)
    setDetectedIngredients([])
    setDishName("")
    setRecipe(null)

    try {
      setCameraStatus("Analyzing image...")
      const result = await scanFood(imageBase64)

      setDishName(result.dishName || "")
      setDetectedIngredients(result.ingredients || [])

      toast.success("Image analyzed successfully!")
      setCameraStatus("Analysis complete")
    } catch (error: any) {
      console.error("Error analyzing image:", error)
      toast.error(error?.message || "Failed to analyze image")
      setCameraStatus("Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateRecipeFromScan = async () => {
    if (detectedIngredients.length === 0) {
      toast.error("No ingredients detected")
      return
    }

    setIsGenerating(true)

    try {
      const ingredientNames = detectedIngredients.map((i) => i.name)
      const generatedRecipe = await generateRecipe(ingredientNames, "International", "None")

      setRecipe(generatedRecipe)
      toast.success("Recipe generated from scan!")
    } catch (error: any) {
      console.error("Error generating recipe:", error)
      toast.error(error?.message || "Failed to generate recipe")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-2 mb-4">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Food Scanner</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Scan Any Dish</h1>
            <p className="text-muted-foreground">
              Upload a photo or use your camera to scan any food. Our AI will identify ingredients and generate the
              perfect recipe.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Input Panel */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </TabsTrigger>

                    <TabsTrigger value="camera" className="gap-2">
                      <Camera className="w-4 h-4" />
                      Live Camera
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="mt-0">
                    <h2 className="text-xl font-semibold text-foreground mb-6">Upload Food Image</h2>

                    <FileUpload onFileSelect={handleFileSelect} preview={preview} onClear={handleClear} />
                  </TabsContent>

                  {/* Camera Tab */}
                  <TabsContent value="camera" className="mt-0">
                    <h2 className="text-xl font-semibold text-foreground mb-6">Capture with Camera</h2>

                    <div className="mb-4 text-sm text-muted-foreground">{cameraStatus}</div>

                    {/* Camera Component */}
                    <CameraCapture ref={cameraRef} onCapture={handleCameraCapture} isProcessing={isAnalyzing} />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Ingredient Results */}
              {detectedIngredients.length > 0 && !isAnalyzing && (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
                  {dishName && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <span className="text-sm text-muted-foreground">Detected Dish:</span>
                      <h3 className="text-lg font-semibold text-foreground">{dishName}</h3>
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-foreground mb-6">Detected Ingredients</h2>

                  <div className="space-y-3">
                    {detectedIngredients.map((ingredient, index) => (
                      <div
                        key={ingredient.name + index}
                        className="flex items-center justify-between p-3 rounded-xl bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{ingredient.name}</span>
                        </div>

                        <span className="text-sm text-muted-foreground">{ingredient.confidence}% match</span>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="w-full mt-6" onClick={generateRecipeFromScan} disabled={isGenerating}>
                    <Sparkles className="w-5 h-5" />
                    {isGenerating ? "Generating..." : "Generate Full Recipe"}
                  </Button>
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {(isAnalyzing || isGenerating) && (
                <LoadingSpinner text={isAnalyzing ? "Analyzing your image..." : "Generating recipe..."} />
              )}

              {recipe && !isGenerating && <RecipeCard {...recipe} />}

              {!recipe && !isAnalyzing && !isGenerating && (
                <div className="h-full flex items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-border">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Upload an image or use your camera to start scanning</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default ScanFood
