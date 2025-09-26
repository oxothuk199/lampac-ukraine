using Shared;
using Shared.Models.Online.Settings;
using Shared.Models.Module;

namespace CikavaIdeya
{
    public class ModInit
    {
        public static OnlinesSettings CikavaIdeya;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded(InitspaceModel initspace)
        {
            CikavaIdeya = new OnlinesSettings("CikavaIdeya", "https://cikava-ideya.top", streamproxy: false, useproxy: false)
            {
                displayname = "ЦікаваІдея",
                displayindex = 0,
                proxy = new Shared.Models.Base.ProxySettings()
                {
                    useAuth = true,
                    username = "a",
                    password = "a",
                    list = new string[] { "socks5://IP:PORT" }
                }
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("cikavaideya");
        }
    }
}