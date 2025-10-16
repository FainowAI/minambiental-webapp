import React, { useState } from 'react';
<<<<<<< HEAD
import LoginModal from './LoginModal';

const LoginHero = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      <main className="w-full max-w-[1670px] ml-[70px] mt-[110px] max-md:max-w-full max-md:mt-10 max-md:ml-4">
=======

const LoginHero = () => {
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);

  const handleLoginClick = () => {
    setIsLoginFormVisible(!isLoginFormVisible);
  };

  return (
    <main className="w-full max-w-[1670px] ml-[70px] mt-[110px] max-md:max-w-full max-md:mt-10 max-md:ml-4">
>>>>>>> 83440827721beb604b967e1897bcf63e36545c95
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <div className="w-[46%] max-md:w-full max-md:ml-0">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/67230a190448214b3b7b1d351c5a6186fae42fdb?placeholderIfAbsent=true"
            alt="Environmental illustration"
            className="aspect-[1] object-contain w-full max-md:max-w-full max-md:mt-10"
          />
        </div>
        <section className="w-[54%] ml-5 max-md:w-full max-md:ml-0">
          <div className="flex w-full flex-col self-stretch items-center text-base font-normal my-auto max-md:max-w-full max-md:mt-10">
            <header className="justify-center items-stretch flex flex-col overflow-hidden text-xl text-[#212529] leading-[1.2] bg-[rgba(255,255,255,0.00)]">
              <h1>
                Bem-vindo a{' '}
                <span style={{ color: 'rgba(165,214,37,1)' }}>M</span>
                <span style={{ color: 'rgba(22,178,232,1)' }}>i</span>
                <span style={{ color: 'rgba(97,56,29,1)' }}>n</span>
                <span style={{ color: 'rgba(2,156,88,1)' }}>A</span>
                <span style={{ color: 'rgba(170,120,80,1)' }}>m</span>
                b
                <span style={{ color: 'rgba(202,178,159,1)' }}>i</span>
                <span style={{ color: 'rgba(165,214,37,1)' }}>e</span>
                <span style={{ color: 'rgba(22,178,232,1)' }}>n</span>
                <span style={{ color: 'rgba(97,56,29,1)' }}>t</span>
                <span style={{ color: 'rgba(2,156,88,1)' }}>a</span>
                <span style={{ color: 'rgba(170,120,80,1)' }}>l</span>
                !
              </h1>
            </header>
            <div className="justify-center items-stretch self-stretch flex w-full flex-col overflow-hidden text-[#212529] text-justify leading-6 bg-[rgba(255,255,255,0.00)] mt-10 max-md:max-w-full">
              <p className="text-[#212529] max-md:max-w-full">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
                ac volutpat lacus. Morbi ultricies iaculis ullamcorper. Aenean
                sit amet commodo leo. Nunc in tellus quis mauris tempus
                commodo in vitae tellus. Phasellus nec ipsum scelerisque,
                placerat augue sed, lacinia ipsum. Pellentesque ut blandit
                nisi. Mauris volutpat purus lectus, ut venenatis felis blandit
                vitae. Vestibulum at finibus nibh. Nam diam erat, interdum vel
                lacus id, congue elementum lorem. Aenean ut nisl eget augue
                vestibulum dictum.
                <br />
                <br />
                Donec cursus tempus tellus, sit amet iaculis quam viverra non.
                Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh,
                vel lobortis dolor. Integer interdum ac urna mollis dignissim.
                Aliquam sit amet sem a augue ultrices volutpat a sed metus.
                Duis ornare leo vitae quam aliquet tempus. In at sapien purus.
              </p>
            </div>
<<<<<<< HEAD
            <button
              onClick={() => setIsLoginModalOpen(true)}
=======
            <button 
              onClick={handleLoginClick}
>>>>>>> 83440827721beb604b967e1897bcf63e36545c95
              className="bg-[rgba(2,156,88,1)] border flex items-center gap-2 overflow-hidden text-white justify-center mt-10 px-3 py-1.5 rounded-md border-[rgba(2,156,88,1)] border-solid hover:bg-[rgba(2,156,88,0.9)] transition-colors"
            >
              <div className="justify-center items-stretch self-stretch flex flex-col overflow-hidden bg-[rgba(255,255,255,0.00)] my-auto">
                <div className="text-white">
                  Realizar Login
                </div>
              </div>
            </button>
<<<<<<< HEAD
=======
            
            {isLoginFormVisible && (
              <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-[#212529] mb-4">Login</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#212529] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#029C58] focus:border-transparent"
                      placeholder="Digite seu email"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#212529] mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#029C58] focus:border-transparent"
                      placeholder="Digite sua senha"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#029C58] focus:ring-[#029C58] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-[#212529]">Lembrar-me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-[#029C58] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#029C58] text-white py-2 px-4 rounded-md hover:bg-[rgba(2,156,88,0.9)] transition-colors"
                  >
                    Entrar
                  </button>
                </form>
              </div>
            )}
>>>>>>> 83440827721beb604b967e1897bcf63e36545c95
          </div>
        </section>
      </div>
    </main>
<<<<<<< HEAD
    </>
=======
>>>>>>> 83440827721beb604b967e1897bcf63e36545c95
  );
};

export default LoginHero;
