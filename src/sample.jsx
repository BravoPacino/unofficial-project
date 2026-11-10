import { createRoot } from 'react-dom/client'
import Sample from './ink/Sample.jsx'
import PlateTest from './ink/PlateTest.jsx'
import Flight from './ink/Flight.jsx'

// VITE_SAMPLE picks the page in a build that has no query string (the private preview): VITE_SAMPLE=flight
const pick = import.meta.env.VITE_SAMPLE || location.search
createRoot(document.getElementById('root')).render(/flight/.test(pick) ? <Flight /> : /plates/.test(pick) ? <PlateTest /> : <Sample />)
