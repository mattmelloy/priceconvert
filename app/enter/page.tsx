"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

export default function Enter() {
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const analyze = async () => {
    if (!price) {
      toast({
        variant: "destructive",
        title: "Please enter a price",
        description: "The price field cannot be empty.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const currency = localStorage.getItem("defaultCurrency") || "USD";
      const region = localStorage.getItem("defaultRegion") || "Australia";

      const requestData = {
        image: `Price: ${price}`, // Send price as text instead of image
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
      console.error("Error analyzing price:", error);
      toast({
        variant: "destructive",
        title: "Error analyzing price",
        description: "Please check the price format and try again.",
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
          <h1 className="text-2xl font-bold ml-2">Enter Price Tag</h1>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="text"
                placeholder="Enter price (e.g., 99.99)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Enter the price as shown on the tag
              </p>
            </div>

            <Button
              className="w-full"
              onClick={analyze}
              disabled={isLoading}
            >
              {isLoading ? "Analyzing..." : "Analyze Price"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}