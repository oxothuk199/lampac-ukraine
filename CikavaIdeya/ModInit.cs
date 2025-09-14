using Shared;  
using Shared.Models.Online.Settings;  
   
namespace CikavaIdeya  
{  
    public class ModInit  
    {  
        public static OnlinesSettings CikavaIdeya;
 
        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded()
        {
            CikavaIdeya = new OnlinesSettings("CikavaIdeya", "https://cikava-ideya.top", streamproxy: false)
            {
                displayname = "ЦікаваІдея"
            };
 
            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("cikavaideya");
        }
    }  
}