using Shared;
using Shared.Models.Online.Settings;
using Shared.Models.Module;

namespace Uaflix
{
    public class ModInit
    {
        public static OnlinesSettings UaFlix;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded(InitspaceModel initspace)
        {
            UaFlix = new OnlinesSettings("Uaflix", "https://uafix.net", streamproxy: false, useproxy: false)
            {
                displayname = "🇺🇦 UaFlix",
                proxy = new Shared.Models.Base.ProxySettings()
                {
                    useAuth = true,
                    username = "a",
                    password = "a",
                    list = new string[] { "socks5://IP:PORT" }
                }
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("uaflix");
        }
    }
}