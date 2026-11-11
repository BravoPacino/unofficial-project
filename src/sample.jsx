import { createRoot } from 'react-dom/client'
import Sample from './ink/Sample.jsx'
import PlateTest from './ink/PlateTest.jsx'
import EstateTest from './ink/EstateTest.jsx'
import Take from './ink/Take.jsx'
import Navbar from './components/Navbar.jsx'

// VITE_SAMPLE picks the page in a build that has no query string (the private preview): VITE_SAMPLE=take
const pick = import.meta.env.VITE_SAMPLE || location.search
createRoot(document.getElementById('root')).render(/hero/.test(pick) ? <><Navbar /><Take /></> : /take/.test(pick) ? <Take /> : /estate/.test(pick) ? <EstateTest /> : /plates/.test(pick) ? <PlateTest /> : <Sample />)
