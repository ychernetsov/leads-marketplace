import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUiStore } from "../store/uiStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface CatalogFile {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  numRows: number | null;
  sampleUrl: string | null;
}

const CatalogPage = () => {
   const { isLoggedIn, isAdmin } = useAuth();
   const navigate = useNavigate();
   const addToast = useUiStore((s) => s.addToast);

   const {
     data: files,
     isLoading,
     isError,
     refetch,
   } = useQuery({
     queryKey: ['files'],
     queryFn: () => api.get<CatalogFile[]>('/files'),
     retry: false,
   });

   async function handleBuy(fileId: string) {
     if (!isLoggedIn) {
       navigate('/login');
       return;
     }
     try {
       const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(
         `/files/${fileId}/checkout`,
       );
       window.location.href = checkoutUrl;
     } catch (err: any) {
       addToast('error', err.message || 'Could not start checkout');
     }
   }

   return (
     <div className="pc-page">
       <div className="pc-header">
         <span className="pc-wordmark">CSV ARCHIVE</span>
         <div style={{ display: 'flex', gap: 18 }}>
           {isLoggedIn ? (
             <>
               {isAdmin ? (
                 <button
                   className="pc-nav-link"
                   onClick={() => navigate('/admin/upload')}
                   style={{ color: 'var(--pc-accent)' }}
                 >
                   UPLOAD
                 </button>
               ) : (
                 <button
                   className="pc-nav-link"
                   onClick={() => navigate('/orders')}
                 >
                   MY PURCHASES
                 </button>
               )}
             </>
           ) : (
             <>
               <button
                 className="pc-nav-link"
                 onClick={() => navigate('/login')}
               >
                 LOG IN
               </button>
               <button
                 className="pc-nav-link"
                 onClick={() => navigate('/signup')}
                 style={{ color: 'var(--pc-accent)' }}
               >
                 SIGN UP
               </button>
             </>
           )}
         </div>
       </div>

       <div className="pc-subheader">
         {files ? `${files.length} DATASETS` : ''} · SAMPLE FREE · $4.00 TO
         UNLOCK THE FULL FILE
       </div>

       {isLoading && (
         <div style={{ padding: 20 }}>
           {new Array(20).fill(0).map((_, i) => (
             <div key={i} className="pc-skeleton" />
           ))}
         </div>
       )}

       {isError && (
         <div className="pc-error-state">
           <div className="pc-row-title">COULDN'T LOAD DATASETS</div>
           <div className="pc-row-meta">
             CHECK YOUR CONNECTION AND TRY AGAIN
           </div>
           <button
             className="pc-pill pc-pill-outline"
             style={{ marginTop: 16 }}
             onClick={() => refetch()}
           >
             RELOAD
           </button>
         </div>
       )}

       {files &&
         files.map((file, i) => (
           <div key={file.id} className="pc-row">
             <div className="pc-row-perforation" />
             <div className="pc-row-hole top" />
             <div className="pc-row-hole bottom" />
             <div className="pc-row-content">
               <div className="pc-row-title">{file.title.toUpperCase()}</div>
               <div className="pc-row-meta">
                 {file.numRows ? `${file.numRows.toLocaleString()} ROWS` : ''}
               </div>
             </div>
             <div style={{ display: 'flex', gap: 8 }}>
               {file.sampleUrl && (
                 <a
                   href={file.sampleUrl}
                   className="pc-pill pc-pill-outline"
                   style={{ textDecoration: 'none' }}
                 >
                   SAMPLE
                 </a>
               )}
               {!isAdmin && (
                 <button
                   className="pc-pill pc-pill-accent"
                   onClick={() => handleBuy(file.id)}
                 >
                   ${(file.priceCents / 100).toFixed(2)} BUY
                 </button>
               )}
             </div>
           </div>
         ))}

       <div className="pc-footer">
         FILES HOSTED ON CLOUDFLARE R2 · PAYMENTS VIA STRIPE
       </div>
     </div>
   );

};

export default CatalogPage;