using Shared;  
using Shared.Models.Online.Settings;  
  
namespace Uaflix  
{  
    public class ModInit  
    {  
        public static OnlinesSettings UaFlix;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded()
        {
            UaFlix = new OnlinesSettings("Uaflix", "https://uafix.net", streamproxy: false)
            {
                displayname = "🇺🇦 UaFlix"
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("uaflix");
        }
    }  
}