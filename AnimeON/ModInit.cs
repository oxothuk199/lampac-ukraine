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
            AnimeON = new OnlinesSettings("AnimeON", "https://animeon.club", streamproxy: false)
            {
                displayname = "🇯🇵 AnimeON"
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("animeon");
        }
    }
}