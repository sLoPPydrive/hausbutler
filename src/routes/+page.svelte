<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Plus, Minus, Trash2, Receipt, PlusCircle, RefreshCw } from 'lucide-svelte';
  import { load as parseYaml } from 'js-yaml';

  let categories = $state([]);
  let activeTab = $state(0);
  let quantities = $state({});
  let customItems = $state([]);
  let yamlUrl = 'https://raw.githubusercontent.com/sloppydrive/hausbutler/main/data.yaml';
  let isLoading = $state(true);
  let showAddCustom = $state(false);
  let customName = $state('');
  let customPrice = $state('');

  const STORAGE_KEY = 'hausbutler_data';
  const CUSTOM_ITEMS_KEY = 'hausbutler_custom_items';

  // Beispieldaten
  const EXAMPLE_DATA = {
    categories: [
      {
        name: 'Erfrischungsgetränke',
        items: [
          { name: 'Cola 0,33l', price: 2.50 },
          { name: 'Fanta 0,33l', price: 2.50 },
          { name: 'Sprite 0,33l', price: 2.50 },
          { name: 'Apfelschorle 0,5l', price: 3.00 },
          { name: 'Orangensaft 0,2l', price: 2.80 }
        ]
      },
      {
        name: 'Heiß- und Kaltgetränke',
        items: [
          { name: 'Kaffee', price: 2.20 },
          { name: 'Cappuccino', price: 2.80 },
          { name: 'Espresso', price: 2.00 },
          { name: 'Tee', price: 2.00 },
          { name: 'Kakao', price: 2.50 }
        ]
      },
      {
        name: 'Biere',
        items: [
          { name: 'Pils 0,33l', price: 3.00 },
          { name: 'Weizen 0,5l', price: 3.80 },
          { name: 'Radler 0,5l', price: 3.50 },
          { name: 'Alkoholfrei 0,33l', price: 2.80 }
        ]
      },
      {
        name: 'Snacks & Speisen',
        items: [
          { name: 'Brezel', price: 1.50 },
          { name: 'Chips', price: 2.00 },
          { name: 'Schokolade', price: 1.80 },
          { name: 'Nüsse', price: 2.50 },
          { name: 'Kuchen (Stück)', price: 3.50 }
        ]
      }
    ]
  };

  onMount(() => {
    loadFromLocalStorage();
    loadCustomItems();
    loadData();
  });

  function loadFromLocalStorage() {
    if (!browser) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      quantities = JSON.parse(saved);
    }
  }

  function loadCustomItems() {
    if (!browser) return;
    const saved = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (saved) {
      customItems = JSON.parse(saved);
    }
  }

  function saveToLocalStorage() {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
  }

  function saveCustomItems() {
    if (!browser) return;
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
  }

  async function loadData() {
    try {
      const response = await fetch(yamlUrl);
      if (response.ok) {
        const yamlText = await response.text();
        categories = parseYAML(yamlText);
      } else {
        categories = EXAMPLE_DATA.categories;
      }
    } catch (e) {
      categories = EXAMPLE_DATA.categories;
    }
    
    // Sonstige Artikel Kategorie hinzufügen
    categories.push({
      name: 'Sonstige Artikel',
      items: customItems
    });
    
    isLoading = false;
  }

  function parseYAML(yamlText) {
    const data = parseYaml(yamlText);
    return data.categories;
  }

  function updateQuantity(categoryIndex, itemIndex, delta) {
    const key = `${categoryIndex}-${itemIndex}`;
    const currentQty = quantities[key] || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
      delete quantities[key];
    } else {
      quantities[key] = newQty;
    }
    saveToLocalStorage();
  }

  let totalAmount = $derived(() => {
    let total = 0;
    Object.keys(quantities).forEach(key => {
      const [catIdx, itemIdx] = key.split('-').map(Number);
      const item = categories[catIdx]?.items[itemIdx];
      if (item && quantities[key]) {
        total += item.price * quantities[key];
      }
    });
    return total;
  });

  let totalItems = $derived(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  });

  function resetAll() {
    if (confirm('Möchten Sie wirklich alle Einträge zurücksetzen?')) {
      quantities = {};
      saveToLocalStorage();
    }
  }

  function addCustomItem() {
    if (!customName || !customPrice) return;
    
    const newItem = {
      name: customName,
      price: parseFloat(customPrice)
    };
    
    customItems = [...customItems, newItem];
    saveCustomItems();
    
    // Kategorie aktualisieren
    categories[categories.length - 1].items = customItems;
    
    customName = '';
    customPrice = '';
    showAddCustom = false;
  }

  function deleteCustomItem(index) {
    if (confirm('Diesen Artikel löschen?')) {
      customItems = customItems.filter((_, i) => i !== index);
      saveCustomItems();
      categories[categories.length - 1].items = customItems;
    }
  }
</script>

<svelte:head>
  <title>Hubertus Hausbutler</title>
  <meta name="description" content="Digitaler Hausbutler für Ferienwohnungen" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#b56e4b" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <div class="max-w-4xl mx-auto">
    
    <!-- Header -->
    <div class="bg-white shadow-lg p-6">
      <div class="flex items-center gap-4 mb-2">
        <img src="icon-512.png" alt="Hubertus Hausbutler" class="w-12 h-12" />
        <h1 class="text-3xl font-bold text-indigo-900">Hubertus Hausbutler</h1>
        <button onclick={() => location.reload()} class="ml-auto p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={22} />
        </button>
      </div>
      <p class="text-gray-600">Erfassen Sie Ihren Verbrauch während Ihres Aufenthalts</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white shadow-lg overflow-x-auto">
      <div class="flex border-b">
        {#each categories as category, index}
          <button
            onclick={() => activeTab = index}
            class="px-6 py-3 font-medium whitespace-nowrap transition-colors {activeTab === index ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}"
          >
            {category.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Items List -->
    <div class="bg-white shadow-lg p-6 min-h-[400px]">
      {#if activeTab === categories.length - 1}
        <!-- Sonstige Artikel -->
        <button
          onclick={() => showAddCustom = !showAddCustom}
          class="w-full mb-4 flex items-center justify-center gap-2 p-4 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          <span class="font-medium">Artikel hinzufügen</span>
        </button>

        {#if showAddCustom}
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              bind:value={customName}
              placeholder="Artikelname"
              class="w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              step="0.01"
              bind:value={customPrice}
              placeholder="Preis (€)"
              class="w-full mb-2 p-2 border rounded"
            />
            <button
              onclick={addCustomItem}
              class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Hinzufügen
            </button>
          </div>
        {/if}
      {/if}

      <div class="space-y-3">
        {#each categories[activeTab]?.items || [] as item, itemIndex}
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{item.name}</h3>
              <p class="text-indigo-600 font-medium">{item.price.toFixed(2)} €</p>
            </div>
            
            <div class="flex items-center gap-3">
              {#if activeTab === categories.length - 1}
                <button
                  onclick={() => deleteCustomItem(itemIndex)}
                  class="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              {/if}
              
              <button
                onclick={() => updateQuantity(activeTab, itemIndex, -1)}
                disabled={(quantities[`${activeTab}-${itemIndex}`] || 0) === 0}
                class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={20} />
              </button>
              
              <span class="text-xl font-bold w-12 text-center">
                {quantities[`${activeTab}-${itemIndex}`] || 0}
              </span>
              
              <button
                onclick={() => updateQuantity(activeTab, itemIndex, 1)}
                class="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Plus size={20} />
              </button>
              
              {#if (quantities[`${activeTab}-${itemIndex}`] || 0) > 0}
                <span class="ml-2 text-gray-600 font-medium w-20 text-right">
                  {(item.price * (quantities[`${activeTab}-${itemIndex}`] || 0)).toFixed(2)} €
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg p-6 mb-20">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Receipt size={28} />
          <h2 class="text-2xl font-bold">Gesamtsumme</h2>
        </div>
        <button
          onclick={resetAll}
          class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          Zurücksetzen
        </button>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="text-lg opacity-90">{totalItems()} Artikel</span>
        <span class="text-4xl font-bold">{totalAmount().toFixed(2)} €</span>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>