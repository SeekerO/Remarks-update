const Main = () => {
  return (
    <div className="h-screen w-screen flex flex-col">
      <Header />
      <div>
        <div></div>

        <div></div>
      </div>
    </div>
  );
};

export default Main;

const Card_input = () => {
  return <div className=""></div>;
};

const Sidebar = () => {
  return <div></div>;
};

import BreadCrumb from "@/app/component/breadcrumb";
import Image from "next/image";
import kkk from "@/lib/image/KKK.png";

const Header = () => {
  return (
    <div className="flex justify-between px-3">
      <BreadCrumb />
      <Image src={kkk} alt="Description of image" width={60} height={30} />
    </div>
  );
};
