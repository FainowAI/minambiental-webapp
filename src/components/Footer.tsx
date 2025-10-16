import React from 'react';

const Footer = () => {
  return (
    <footer className="items-stretch flex w-full flex-col justify-center bg-[rgba(0,0,0,0.03)] mt-[142px] px-4 py-2 border-t-[rgba(0,0,0,0.18)] border-t border-solid max-md:max-w-full max-md:mt-10">
      <div className="flex min-h-6 w-full bg-[rgba(255,255,255,0.00)] max-md:max-w-full">
        <div className="text-center w-full text-sm text-gray-600 py-4">
          © 2024 MinAmbiental. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
