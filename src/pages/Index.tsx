import React from 'react';
import Navbar from '@/components/Navbar';
import LoginHero from '@/components/LoginHero';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="overflow-hidden bg-white min-h-screen">
      <Navbar />
      <LoginHero />
      <Footer />
    </div>
  );
};

export default Index;
