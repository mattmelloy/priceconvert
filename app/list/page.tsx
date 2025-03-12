"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Trash2, Bug } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScannedItem {
  detected_price: string;
  original_currency: string;
  converted_price: string;
  applicable_tax_rate: string;
  applicable_taxes: string;
  total_price_local: string;
  total_price: string;
  timestamp: number;
  debug?: {
    request?: any;
    response?: any;
  };
}

export default function List() {
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [targetCurrency, setTargetCurrency] = useState<string>("USD");
  const [selectedItem, setSelectedItem] = useState<ScannedItem | null>(null);

  useEffect(() => {
    const savedItems = localStorage.getItem("scannedItems");
    const savedCurrency = localStorage.getItem("defaultCurrency");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedCurrency) {
      setTargetCurrency(savedCurrency);
    }
  }, []);

  const removeItem = (timestamp: number) => {
    const newItems = items.filter((item) => item.timestamp !== timestamp);
    setItems(newItems);
    localStorage.setItem("scannedItems", JSON.stringify(newItems));
  };

  const clearAllItems = () => {
    setItems([]);
    localStorage.setItem("scannedItems", JSON.stringify([]));
  };

  const totalConverted = items
    .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
    .toFixed(2);

  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-2">Scanned Items</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total (Converted)</p>
            <p className="text-xl font-bold">{totalConverted} {targetCurrency}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No items scanned yet
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.timestamp} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {item.detected_price} {item.original_currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Converted: {item.converted_price} {targetCurrency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tax Rate: {item.applicable_tax_rate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tax: {item.applicable_taxes} {targetCurrency}
                    </p>
                    <p className="text-sm font-medium">
                      Local Total: {item.total_price_local} {item.original_currency}
                    </p>
                    <p className="text-sm font-medium">
                      Converted Total: {item.total_price} {targetCurrency}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Bug className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Debug Information</DialogTitle>
                          <DialogDescription>
                            Complete request and response data for this scan
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-bold mb-2">Request:</h3>
                              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                                {JSON.stringify(item.debug?.request || {}, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h3 className="font-bold mb-2">Response:</h3>
                              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                                {JSON.stringify(item.debug?.response || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.timestamp)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-6">
                  Clear All Items
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your scanned items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllItems}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </main>
  );
}