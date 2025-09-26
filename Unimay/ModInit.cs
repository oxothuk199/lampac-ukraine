using Shared;
using Shared.Models.Online.Settings;
using Shared.Models.Module;

namespace Unimay
{
    public class ModInit
    {
        public static OnlinesSettings Unimay;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded(InitspaceModel initspace)
        {
            Unimay = new OnlinesSettings("Unimay", "https://api.unimay.media/v1", streamproxy: false, useproxy: false)
            {
                displayname = "Unimay",
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
            AppInit.conf.online.with_search.Add("unimay");
        }
    }
}