import BlueDotCursor from './components/BlueDotCursor'
import Header from './components/Header'
import Hero from './components/Hero'
import Approach from './components/Approach'
import Projects from './components/Projects'
import WaysToWork from './components/WaysToWork'
import Quiz from './components/Quiz'
import Footer from './components/Footer'
import { RobotMoodProvider } from './context/RobotMood'

export default function App() {
  return (
    <RobotMoodProvider>
      <div className="min-h-screen bg-cream">
        <BlueDotCursor />
        <Header />
        <main>
          <Hero />
          <Approach />
          <Projects />
          <WaysToWork />
          <Quiz />
        </main>
        <Footer />
      </div>
    </RobotMoodProvider>
  )
}
