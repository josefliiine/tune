import { Routes, Route } from "react-router-dom";
import './assets/scss/App.scss';
import LandingPage from './pages/LandingPage';

function App() {

  return (
    <Routes>
      <Route>
        <Route path="/" element={<LandingPage />} />
      </Route>
    </Routes>
  )
}

export default App
