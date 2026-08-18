import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Nav from './components/Nav.jsx'
import Router from './routes/Router.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Router />
      </BrowserRouter>
    </AuthProvider>
  )
}
