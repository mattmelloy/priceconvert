"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Camera, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function Scan() {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImgSrc(screenshot);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  const analyze = async () => {
    if (!imgSrc) return;

    setIsLoading(true);
    try {
      const currency = localStorage.getItem("defaultCurrency") || "USD";
      const region = localStorage.getItem("defaultRegion") || "Australia";

      const requestData = {
        image: imgSrc,
        currency,
        region,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add to scanned items with debug info
      const scannedItems = JSON.parse(localStorage.getItem("scannedItems") || "[]");
      scannedItems.unshift({
        ...result,
        timestamp: Date.now(),
        debug: {
          request: requestData,
          response: result
        }
      });
      localStorage.setItem("scannedItems", JSON.stringify(scannedItems));

      toast({
        title: "Price analyzed successfully",
        description: "The item has been added to your list.",
      });

      router.push("/list");
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        title: "Error analyzing price",
        description: "Please try again with a clearer photo of the price tag.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold ml-2">Scan Price Tag</h1>
        </div>

        <Card className="p-4">
          {imgSrc ? (
            <div className="space-y-4">
              <img src={imgSrc} alt="captured" className="w-full rounded-lg" />
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={retake}
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button
                  className="flex-1"
                  onClick={analyze}
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : "Analyze Price"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "environment",
                }}
              />
              <Button className="w-full" onClick={capture}>
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}