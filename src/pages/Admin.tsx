import AdminLayout from "../components/admin/AdminLayout";
import ProductList from "../components/admin/ProductList";
import OrderList from "../components/admin/OrderList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, IndianRupee, Database, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { productService } from "@/lib/services/productService";
import { orderService, Order } from "@/lib/services/orderService";
import { reviewService, Review } from "@/lib/services/reviewService";
import ReviewList from "../components/admin/ReviewList";
import { products as staticProducts, giftSet as staticGiftSet, formatPrice, Product } from "@/lib/products";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SettingsTab from "@/components/admin/SettingsTab";
import BlogManager from "@/components/admin/BlogManager";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import { BookOpen } from "lucide-react";
import NewOrderForm from "@/components/admin/NewOrderForm";

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & { product_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsResult, ordersResult, reviewsResult] = await Promise.allSettled([
        productService.getProducts(),
        orderService.getOrders(),
        reviewService.getAllReviews()
      ]);

      // Handle Products
      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value);

        // Auto-seed logic inside product success
        if (productsResult.value.length === 0 && !isSeeding) {
          console.log("No products found, checking seed...");
          const allToSeed = [...staticProducts, { ...staticGiftSet, isGiftSet: true }];
          const seedResult = await productService.seedInitialProducts(allToSeed);

          if (seedResult.success) {
            const reFetch = await productService.getProducts();
            setProducts(reFetch);
            toast.success(seedResult.message);
          } else {
            // Only show error if it's a real error, not just "skipped"
            if (!seedResult.message.includes("already populated")) {
              toast.error(seedResult.message);
            }
          }
        }
      } else {
        console.error("Failed to fetch products:", productsResult.reason);
        toast.error("Failed to load products. Check console.");
      }

      // Handle Orders
      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value);
      } else {
        console.error("Failed to fetch orders:", ordersResult.reason);
        toast.error("Failed to load orders.");
      }

      // Handle Reviews
      if (reviewsResult.status === "fulfilled") {
        setReviews(reviewsResult.value);
      } else {
        console.error("Failed to fetch reviews:", reviewsResult.reason);
        // Suppress toast for strictly missing schema to avoid confusing users adding products
      }

    } catch (error) {
      console.error("Critical error in Admin dashboard:", error);
      toast.error("Dashboard failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const allToSeed = [...staticProducts, { ...staticGiftSet, isGiftSet: true }];
      const result = await productService.seedInitialProducts(allToSeed);

      // Also seed reviews if products seeded successfully or already exist
      const reviewsResult = await reviewService.seedInitialReviews();

      // Seed site settings
      const { defaultHomeMediaSlots } = await import("@/lib/homeMedia");
      const settingsResult = await settingsService.initializeDefaultSettings(defaultHomeMediaSlots);

      if (result.success) {
        let msg = result.message;
        if (reviewsResult.success && !reviewsResult.message.includes("already populated")) {
          msg += " Reviews seeded!";
        }
        if (settingsResult.success && settingsResult.message !== "Settings already exist") {
          msg += " Settings initialized!";
        }

        if (msg.includes("already populated") && reviewsResult.message.includes("already populated")) {
          toast.info("Database already fully populated");
        } else {
          toast.success(msg);
          fetchData();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Seeding process failed unexpectedly.");
    } finally {
      setIsSeeding(false);
    }
  };

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    { label: "Total Products", value: products.filter(p => !p.isGiftSet).length.toString(), icon: Package, color: "text-blue-500" },
    { label: "Total Orders", value: orders.length.toString(), icon: ShoppingCart, color: "text-green-500" },
    { label: "Revenue", value: formatPrice(revenue), icon: IndianRupee, color: "text-gold" },
  ];

  const [activeTab, setActiveTab] = useState("products");

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with Saree Sutra today.</p>
          </div>
          <div className="flex items-center gap-4">
            {products.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeed}
                disabled={isSeeding}
                className="border-gold text-gold hover:bg-gold hover:text-white"
              >
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                Seed Initial Data
              </Button>
            )}
            <div className="text-sm font-medium px-4 py-2 bg-gold/10 text-gold rounded-full border border-gold/20">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border shadow-soft hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-sm bg-muted group-hover:bg-background transition-colors`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 max-w-[1000px]">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="blog">Journal</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your saree collection.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ProductList products={products} loading={loading} onRefresh={fetchData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>View and manage customer orders.</CardDescription>
                </div>
                <NewOrderForm onSuccess={fetchData} />
              </CardHeader>
              <CardContent>
                <OrderList orders={orders} loading={loading} onRefresh={fetchData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>Manage customer feedback and ratings.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewList reviews={reviews} loading={loading} onRefresh={fetchData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Admin;
