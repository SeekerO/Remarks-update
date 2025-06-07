import BreadCrumb from "../component/breadcrumb";
import Main from "./component/Main";

const Evaluation = () => {
  return (
    <div className="h-screen w-screen flex flex-col gap-3 py-5 px-7">
      <BreadCrumb />
      <div>
        <Main />
      </div>
    </div>
  );
};

export default Evaluation;
