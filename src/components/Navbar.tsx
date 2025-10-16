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
        <nav className="items-center self-stretch flex min-w-60 text-base text-[#029C58] flex-1 shrink basis-8 bg-[rgba(255,255,255,0.00)] my-auto max-md:max-w-full">
          <div className="self-stretch flex min-w-60 w-72 items-center gap-2 my-auto">
            <div className="items-center content-center flex-wrap self-stretch flex min-w-60 gap-2 bg-[rgba(255,255,255,0.00)] my-auto">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="justify-center items-center border self-stretch flex gap-2 overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto px-3 py-1.5 rounded-md border-solid border-[#029C58] hover:bg-[#029C58] hover:text-white transition-colors"
              >
                <div className="justify-center items-stretch self-stretch flex flex-col overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto">
                  <div>Realizar Login</div>
                </div>
              </button>
              <button className="justify-center items-center border self-stretch flex gap-2 overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto px-3 py-1.5 rounded-md border-solid border-[#029C58] hover:bg-[#029C58] hover:text-white transition-colors">
                <div className="justify-center items-stretch self-stretch flex flex-col overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto">
                  <div>Redefinir Senha</div>
                </div>
              </button>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
