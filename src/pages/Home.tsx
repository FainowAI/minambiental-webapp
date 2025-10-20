import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#f8f9fa] flex items-center px-3 py-2 h-[73px]">
        <img
          src="http://localhost:3845/assets/17cd82d0b53defa48d0db5a8b3c90b892efc24fe.png"
          alt="MinAmbiental Logo"
          className="w-[30px] h-[30px] object-cover"
        />
        <div className="px-4 py-[5px]">
          <span className="text-[20px] text-black opacity-90 font-['Roboto'] leading-[1.5]">
            MinAmbiental
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex items-center">
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.9)] font-['Roboto'] leading-[1.5]">
                Home
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.55)] font-['Roboto'] leading-[1.5]">
                Licenças e Contratos
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.55)] font-['Roboto'] leading-[1.5]">
                Usuário
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <button className="bg-[#029c58] rounded-[30px] w-[77px] h-[38px] flex items-center justify-center">
              <img
                src="http://localhost:3845/assets/1ee65d81e21b78ce7cc2e0afed75dda0f20d3f71.svg"
                alt="User Avatar"
                className="w-full h-full"
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-[70px] py-[50px]">
        {/* Title */}
        <h1 className="text-[20px] text-[#212529] font-['Roboto'] font-normal leading-[1.2] mb-6">
          Bem-vindo a <span className="text-[#a5d625]">M</span>
          <span className="text-[#16b2e8]">i</span>
          <span className="text-[#61381d]">n</span>
          <span className="text-[#029c58]">A</span>
          <span className="text-[#aa7850]">m</span>
          <span className="text-[#212529]">b</span>
          <span className="text-[#cab29f]">i</span>
          <span className="text-[#a5d625]">e</span>
          <span className="text-[#16b2e8]">n</span>
          <span className="text-[#61381d]">t</span>
          <span className="text-[#029c58]">a</span>
          <span className="text-[#aa7850]">l</span>!
        </h1>

        {/* Description Text */}
        <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5] text-justify mb-8">
          Donec cursus tempus tellus, sit amet iaculis quam viverra non. Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh, vel lobortis dolor. Integer interdum ac urna mollis dignissim. Aliquam sit amet sem a augue ultrices volutpat a sed metus. Duis ornare leo vitae quam aliquet tempus. In at sapien purus. Donec cursus tempus tellus, sit amet iaculis quam viverra non. Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh, vel lobortis dolor. Integer interdum ac urna mollis dignissim. Aliquam sit amet sem a augue ultrices volutpat a sed metus. Duis ornare leo vitae quam aliquet tempus. In at sapien purus.
        </p>

        {/* Cards */}
        <div className="flex gap-[30px] justify-start flex-wrap">
          {/* Card 1 - Licenças e Contratos */}
          <Card className="w-[500px] border border-[rgba(0,0,0,0.18)] rounded-md">
            <CardHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
              <div className="flex items-center gap-2 px-1">
                <img
                  src="http://localhost:3845/assets/cfacd15031c9e11e6cb8ecd85be864af9b3f43af.svg"
                  alt="Licenças Icon"
                  className="w-4 h-4"
                />
                <span className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                  Licenças e Contratos
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5] mb-4">
                Donec cursus tempus tellus, sit amet iaculis quam viverra non. Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh, vel lobortis dolor. Integer interdum ac urna mollis dignissim.
              </p>
              <Button className="bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-[16px] font-['Roboto'] py-[7px] px-[13px] h-auto rounded-md">
                Ir
              </Button>
            </CardContent>
            <CardFooter className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
              <p className="text-[16px] text-[#212529]">&nbsp;</p>
            </CardFooter>
          </Card>

          {/* Card 2 - Usuário */}
          <Card className="w-[500px] border border-[rgba(0,0,0,0.18)] rounded-md">
            <CardHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
              <div className="flex items-center gap-2 px-1">
                <img
                  src="http://localhost:3845/assets/01602cb150c78838c4af741e00a593ab56ae2f04.svg"
                  alt="Usuário Icon"
                  className="w-4 h-4"
                />
                <span className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                  Usuário
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5] mb-4">
                Donec cursus tempus tellus, sit amet iaculis quam viverra non. Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh, vel lobortis dolor. Integer interdum ac urna mollis dignissim.
              </p>
              <Button
                onClick={() => navigate('/users')}
                className="bg-[#029c58] hover:bg-[#028a4d] border border-[#aa7850] text-white text-[16px] font-['Roboto'] py-[7px] px-[13px] h-auto rounded-md"
              >
                Ir
              </Button>
            </CardContent>
            <CardFooter className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
              <p className="text-[16px] text-[#212529]">&nbsp;</p>
            </CardFooter>
          </Card>

          {/* Card 3 - Dashboard */}
          <Card className="w-[500px] border border-[rgba(0,0,0,0.18)] rounded-md">
            <CardHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
              <div className="flex items-center gap-2 px-1">
                <img
                  src="http://localhost:3845/assets/08b802e732eb5dd70abc929f9dc1bcdb3005b0cf.svg"
                  alt="Dashboard Icon"
                  className="w-4 h-4"
                />
                <span className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                  Dashboard
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5] mb-4">
                Donec cursus tempus tellus, sit amet iaculis quam viverra non. Vivamus ornare lacinia eleifend. Vestibulum in venenatis nibh, vel lobortis dolor. Integer interdum ac urna mollis dignissim.
              </p>
              <Button className="bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-[16px] font-['Roboto'] py-[7px] px-[13px] h-auto rounded-md">
                Ir
              </Button>
            </CardContent>
            <CardFooter className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
              <p className="text-[16px] text-[#212529]">&nbsp;</p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2 mt-auto">
        <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">&nbsp;</p>
      </footer>
    </div>
  );
};

export default Home;
