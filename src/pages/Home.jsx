import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import MatchmakingSection from '../components/home/MatchmakingSection'
import FeaturedSupervisors from '../components/home/FeaturedSupervisors'
import ResearchDomains from '../components/home/ResearchDomains'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <MatchmakingSection />
      <FeaturedSupervisors />
      <ResearchDomains />
    </div>
  )
}
