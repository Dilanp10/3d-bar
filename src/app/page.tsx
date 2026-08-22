import { HeroSection } from "./HeroSection";
import { FeaturedDishes } from "./FeaturedDishes";
import { BusinessInfo } from "./BusinessInfo";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col">
      <HeroSection />
      <FeaturedDishes />
      <BusinessInfo />
    </main>
  );
}
