import Header from "./Header";
import "./template.css";



export default function Template({ children }) {
  return (
    <div className="app-template">
      <Header />
      <main className="app-main">
        {children}
      </main>
 
    </div>
    
  );
}




