using Shared;
using Shared.Models.Online.Settings;

namespace Unimay
{
    public class ModInit
    {
        public static OnlinesSettings Unimay;

        /// <summary>
        /// модуль загружен
        /// </summary>
        public static void loaded()
        {
            Unimay = new OnlinesSettings("Unimay", "https://api.unimay.media/v1", streamproxy: true)
            {
                displayname = "Unimay"
            };

            // Виводити "уточнити пошук"
            AppInit.conf.online.with_search.Add("unimay");
        }
    }
}