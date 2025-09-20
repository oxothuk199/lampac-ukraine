using Shared;
using Shared.Models.Online.Settings;
using Shared.Models.Module;

namespace AnimeON
{
    public class ModInit
    {
        public static OnlinesSettings AnimeON;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded(InitspaceModel initspace)
        {
            AnimeON = new OnlinesSettings("AnimeON", "https://animeon.club", streamproxy: false, useproxy: false)
            {
                displayname = "🇯🇵 AnimeON",
                displayindex = 0,
                proxy = new Shared.Models.Base.ProxySettings()
                {
                    useAuth = true,
                    username = "",
                    password = "",
                    list = new string[] { "socks5://ip:port" }
                }
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("animeon");
        }
    }
}