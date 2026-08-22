import { HeroSection } from "./HeroSection";
import { HowItWorks } from "./HowItWorks";
import { FeaturedDishes } from "./FeaturedDishes";
import { BusinessInfo } from "./BusinessInfo";
import { Footer } from "./Footer";

export default function Home() {
  return (
    <>
      <main className="flex flex-col">
        <HeroSection />
        <HowItWorks />
        <FeaturedDishes />
        <BusinessInfo />
      </main>
      <Footer />
    </>
  );
}
