
import logo from "@/assets/livestockpro1.png"

const Logo = ({ style }: { style? :string }) => {
  return (
    <div className={`${style} flex items-center`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-200">
        <img  className="h-5 w-5" src={logo}  />
        </div>
         <span className="text-2xl font-bold">LiveStockPro</span>
    </div>
  )
}

export default Logo
