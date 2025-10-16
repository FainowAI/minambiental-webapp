import React, { useState } from 'react';
import LoginModal from './LoginModal';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      <header className="items-center flex min-h-[73px] w-full font-normal flex-wrap bg-[#F8F9FA] px-3 py-[17px] max-md:max-w-full">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/74e3aee1c78f811a10ead1a1b0917e5c41cff3b1?placeholderIfAbsent=true"
          alt="MinAmbiental Logo"
          className="aspect-[1] object-contain w-[30px] self-stretch shrink-0 my-auto"
        />
        <div className="items-center self-stretch flex text-xl text-black whitespace-nowrap bg-[rgba(255,255,255,0.00)] my-auto px-4 py-[5px]">
          <div className="justify-center items-stretch self-stretch flex flex-col overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto">
            <div className="text-black opacity-90">
              MinAmbiental
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
