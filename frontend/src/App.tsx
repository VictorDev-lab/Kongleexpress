import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index.tsx';
import OrderPage from './pages/Order.tsx';
import SubscribePage from './pages/Subscribe.tsx';
import AboutPage from './pages/About.tsx';
import SuccessPage from './pages/Success.tsx';
import CancelPage from './pages/Cancel.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';

/**
 * Hovedkomponenten for applikasjonen.
 * Setter opp ruting ved hjelp av React Router DOM og inkluderer felles layout-komponenter.
 */
function App() {
  return (
    // BrowserRouter muliggjør navigasjon i nettleseren
    <Router>
      {/* Header vises på alle sider */}
      <Header />
      {/* Hovedinnholdet for hver side, sentrert og med felles styling */}
      <main className="max-w-3xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-lg">
        {/* Routes definerer de forskjellige URL-stiene og hvilke komponenter de skal rendre */}
        <Routes>
          <Route path="/" element={<IndexPage />} /> {/* Hjemmeside */}
          <Route path="/order" element={<OrderPage />} /> {/* Bestillingsside for engangs-kongler */}
          <Route path="/subscribe" element={<SubscribePage />} /> {/* Abonnementsside for månedlige leveranser */}
          <Route path="/about" element={<AboutPage />} /> {/* Om oss-side */}
          <Route path="/success" element={<SuccessPage />} /> {/* Side for vellykket betaling */}
          <Route path="/cancel" element={<CancelPage />} /> {/* Side for avbrutt betaling */}
        </Routes>
      </main>
      {/* Footer vises på alle sider */}
      <Footer />
    </Router>
  );
}

export default App;