import { createRoot } from 'react-dom/client'
import Sample from './ink/Sample.jsx'
import PlateTest from './ink/PlateTest.jsx'

createRoot(document.getElementById('root')).render(/plates/.test(location.search) ? <PlateTest /> : <Sample />)
