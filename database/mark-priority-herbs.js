const { Pool } = require('pg');

// List of 300 most important herbs by latin name
const priorityHerbs = [
  'Abies alba', 'Acacia senegal', 'Acalypha indica', 'Acanthus mollis', 'Achillea millefolium',
  'Acorus calamus', 'Adhatoda vasica', 'Adiantum pedatum', 'Aegopodium podagraria', 'Aesculus hippocastanum',
  'Agastache foeniculum', 'Agrimonia eupatoria', 'Agropyron repens', 'Elymus repens', 'Ajuga reptans',
  'Alcea rosea', 'Alchemilla arvensis', 'Alchemilla vulgaris', 'Albizia julibrissin', 'Alhagi maurorum',
  'Alkanna tinctoria', 'Allium cepa', 'Allium sativum', 'Allium schoenoprasum', 'Aloe vera',
  'Althaea officinalis', 'Anagallis arvensis', 'Ananas comosus', 'Anchusa officinalis', 'Andrographis paniculata',
  'Anemone pulsatilla', 'Anethum graveolens', 'Angelica archangelica', 'Anthriscus cerefolium', 'Anthemis cotula',
  'Anthyllis vulneraria', 'Apium graveolens', 'Aquilegia vulgaris', 'Arbutus unedo', 'Arctium lappa',
  'Arctostaphylos uva-ursi', 'Armoracia rusticana', 'Arnica montana', 'Artemisia abrotanum', 'Artemisia absinthium',
  'Artemisia dracunculus', 'Artemisia vulgaris', 'Asparagus officinalis', 'Asperula odorata', 'Galium odoratum',
  'Avena sativa', 'Bacopa monnieri', 'Ballota nigra', 'Bellis perennis', 'Berberis aquifolium',
  'Mahonia aquifolium', 'Berberis vulgaris', 'Beta vulgaris', 'Betula pendula', 'Bistorta officinalis',
  'Persicaria bistorta', 'Borago officinalis', 'Boswellia serrata', 'Brassica oleracea', 'Bupleurum falcatum',
  'Calendula officinalis', 'Calluna vulgaris', 'Camellia sinensis', 'Capsella bursa-pastoris', 'Capsicum frutescens',
  'Cardamine pratensis', 'Carlina acaulis', 'Carthamus tinctorius', 'Carum carvi', 'Castanea sativa',
  'Caulophyllum thalictroides', 'Ceanothus americanus', 'Centaurium erythraea', 'Centaurea cyanus', 'Centella asiatica',
  'Ceratonia siliqua', 'Cetraria islandica', 'Chamaemelum nobile', 'Chelidonium majus', 'Cichorium intybus',
  'Cimicifuga racemosa', 'Cinnamomum verum', 'Citrus limon', 'Clinopodium vulgare', 'Cnidium monnieri',
  'Coleus forskohlii', 'Plectranthus barbatus', 'Collinsonia canadensis', 'Commiphora myrrha', 'Coriandrum sativum',
  'Cornus sericea', 'Corydalis cava', 'Corylus avellana', 'Crataegus monogyna', 'Crocus sativus',
  'Cucurbita pepo', 'Cuminum cyminum', 'Curcuma longa', 'Cymbopogon citratus', 'Cynara cardunculus',
  'Cynoglossum officinale', 'Daucus carota', 'Dioscorea villosa', 'Dipsacus fullonum', 'Dracaena draco',
  'Drosera rotundifolia', 'Echinacea angustifolia', 'Echinacea pallida', 'Echinacea purpurea', 'Elettaria cardamomum',
  'Eleutherococcus senticosus', 'Epilobium angustifolium', 'Equisetum arvense', 'Eriodictyon californicum', 'Eruca vesicaria',
  'Eryngium maritimum', 'Eschscholzia californica', 'Eucalyptus globulus', 'Eupatorium cannabinum', 'Eupatorium perfoliatum',
  'Euphrasia officinalis', 'Ficaria verna', 'Ranunculus ficaria', 'Filipendula ulmaria', 'Foeniculum vulgare',
  'Fragaria vesca', 'Fucus vesiculosus', 'Fumaria officinalis', 'Galega officinalis', 'Galium aparine',
  'Galium verum', 'Gentiana lutea', 'Geranium robertianum', 'Geum urbanum', 'Ginkgo biloba',
  'Glechoma hederacea', 'Glycyrrhiza glabra', 'Gnaphalium uliginosum', 'Grindelia camporum', 'Gymnema sylvestre',
  'Hamamelis virginiana', 'Harpagophytum procumbens', 'Hedeoma pulegioides', 'Helichrysum italicum', 'Hepatica nobilis',
  'Hibiscus sabdariffa', 'Hieracium pilosella', 'Humulus lupulus', 'Hydrangea arborescens', 'Hydrastis canadensis',
  'Hyssopus officinalis', 'Ilex aquifolium', 'Illicium verum', 'Imperatoria ostruthium', 'Peucedanum ostruthium',
  'Inula helenium', 'Iris pseudacorus', 'Iris versicolor', 'Jasminum officinale', 'Juglans nigra',
  'Juniperus communis', 'Knautia arvensis', 'Lactuca virosa', 'Lamium album', 'Lapsana communis',
  'Larrea tridentata', 'Laurus nobilis', 'Lavandula angustifolia', 'Lavandula stoechas', 'Ledum palustre',
  'Rhododendron tomentosum', 'Leonurus cardiaca', 'Levisticum officinale', 'Lippia citriodora', 'Aloysia citrodora',
  'Ligusticum porteri', 'Ligustrum vulgare', 'Linum usitatissimum', 'Lobaria pulmonaria', 'Lobelia inflata',
  'Malva sylvestris', 'Marrubium vulgare', 'Matricaria chamomilla', 'Medicago sativa', 'Melaleuca alternifolia',
  'Melissa officinalis', 'Mentha spicata', 'Mentha suaveolens', 'Mentha x piperita', 'Menyanthes trifoliata',
  'Momordica charantia', 'Monarda didyma', 'Myrica cerifera', 'Myristica fragrans', 'Myrrhis odorata',
  'Myrtus communis', 'Nasturtium officinale', 'Nepeta cataria', 'Nigella sativa', 'Ocimum basilicum',
  'Ocimum tenuiflorum', 'Ocimum sanctum', 'Oenanthe phellandrium', 'Oenothera biennis', 'Olea europaea',
  'Ononis spinosa', 'Origanum majorana', 'Origanum vulgare', 'Oxalis acetosella', 'Paeonia officinalis',
  'Panax ginseng', 'Parietaria officinalis', 'Passiflora incarnata', 'Pastinaca sativa', 'Petasites hybridus',
  'Petroselinum crispum', 'Peumus boldus', 'Pilosella officinarum', 'Pimpinella anisum', 'Pimpinella saxifraga',
  'Pinus sylvestris', 'Pistacia lentiscus', 'Plantago lanceolata', 'Plantago major', 'Plantago psyllium',
  'Polygala senega', 'Polygonum aviculare', 'Populus nigra', 'Portulaca oleracea', 'Potentilla anserina',
  'Potentilla erecta', 'Primula veris', 'Prunella vulgaris', 'Prunus serotina', 'Pulmonaria officinalis',
  'Punica granatum', 'Quercus robur', 'Reseda luteola', 'Rhamnus purshiana', 'Rheum palmatum',
  'Rhodiola rosea', 'Ribes nigrum', 'Rosa canina', 'Rosa gallica', 'Rosmarinus officinalis',
  'Rubus fruticosus', 'Rubus idaeus', 'Rumex crispus', 'Ruscus aculeatus', 'Ruta graveolens',
  'Salix alba', 'Salvia apiana', 'Salvia hispanica', 'Salvia officinalis', 'Salvia sclarea',
  'Sambucus ebulus', 'Sambucus nigra', 'Sanicula europaea', 'Sanguinaria canadensis', 'Sanguisorba officinalis',
  'Saponaria officinalis', 'Satureja hortensis', 'Satureja montana', 'Schisandra chinensis', 'Scrophularia nodosa',
  'Scutellaria lateriflora', 'Sempervivum tectorum', 'Serenoa repens', 'Silybum marianum', 'Sinapis alba',
  'Sisymbrium officinale', 'Smilax spp.', 'Solidago virgaurea', 'Sorbus aucuparia', 'Stachys officinalis',
  'Stellaria media', 'Symphoricarpos albus', 'Symphytum officinale', 'Syzygium aromaticum', 'Tamarindus indica',
  'Tanacetum parthenium', 'Tanacetum vulgare', 'Taraxacum officinale', 'Teucrium scorodonia', 'Thymus serpyllum',
  'Thymus vulgaris', 'Tilia x europaea', 'Tribulus terrestris', 'Trifolium pratense', 'Trigonella foenum-graecum',
  'Tropaeolum majus', 'Turnera diffusa', 'Tussilago farfara', 'Ulmus rubra', 'Urtica dioica',
  'Vaccinium myrtillus', 'Valeriana officinalis', 'Verbascum thapsus', 'Verbena officinalis', 'Veronica officinalis',
  'Veronicastrum virginicum', 'Viburnum opulus', 'Viburnum prunifolium', 'Vinca major', 'Vinca minor',
  'Viola odorata', 'Viola tricolor', 'Vitex agnus-castus', 'Withania somnifera', 'Zanthoxylum americanum',
  'Zingiber officinale'
];

async function markPriorityHerbs() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // First, add the is_priority column if it doesn't exist
    console.log('Adding is_priority column to herbs table...');
    await pool.query(`
      ALTER TABLE herbs 
      ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE
    `);

    // Reset all herbs to non-priority first
    console.log('Resetting all herbs to non-priority...');
    await pool.query('UPDATE herbs SET is_priority = FALSE');

    // Mark priority herbs
    console.log('Marking priority herbs...');
    let markedCount = 0;

    for (const latinName of priorityHerbs) {
      const result = await pool.query(
        'UPDATE herbs SET is_priority = TRUE WHERE latin_name ILIKE $1',
        [latinName.trim()]
      );
      
      if (result.rowCount > 0) {
        markedCount += result.rowCount;
        console.log(`✓ Marked ${latinName} as priority`);
      } else {
        console.log(`⚠ Could not find herb: ${latinName}`);
      }
    }

    console.log(`\nCompleted! Marked ${markedCount} herbs as priority out of ${priorityHerbs.length} in the list.`);

    // Show some stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_herbs,
        COUNT(*) FILTER (WHERE is_priority = TRUE) as priority_herbs,
        COUNT(*) FILTER (WHERE is_priority = FALSE) as regular_herbs
      FROM herbs
    `);

    console.log('\nDatabase Statistics:');
    console.log(`Total herbs: ${stats.rows[0].total_herbs}`);
    console.log(`Priority herbs: ${stats.rows[0].priority_herbs}`);
    console.log(`Regular herbs: ${stats.rows[0].regular_herbs}`);

  } catch (error) {
    console.error('Error marking priority herbs:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
markPriorityHerbs().catch(console.error);
