import DrawerMenu from "./DrawerMenu";

function DrawerSide() {
  return (
    <div className="drawer-side z-30">
      <label
        htmlFor="mobile-navigation"
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <DrawerMenu />
    </div>
  );
}

export default DrawerSide;
