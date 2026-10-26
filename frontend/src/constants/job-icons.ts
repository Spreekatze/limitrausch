import { JOB_ID, type JobId } from '@limitrausch/contracts';

import allrounderIcon from '../assets/jobIcons/Role_Allrounder.png';
import tankHealIcon from '../assets/jobIcons/Role_TankHeal.png';
import tankDpsIcon from '../assets/jobIcons/Role_TankDps.png';
import healDpsIcon from '../assets/jobIcons/Role_HealDps.png';
// import barrierHealIcon from '../assets/jobIcons/Role_BarrierHeal.png';
// import regenHealIcon from '../assets/jobIcons/Role_RegenHeal.png';
import tankIcon from '../assets/jobIcons/Role_Tank.png';
import healerIcon from '../assets/jobIcons/Role_Healer.png';
import meleeIcon from '../assets/jobIcons/Role_Melee.png';
import prangedIcon from '../assets/jobIcons/Role_PhysRanged.png';
import casterIcon from '../assets/jobIcons/Role_Caster.png';
import dpsIcon from '../assets/jobIcons/Role_DPS.png';
import paladinIcon from '../assets/jobIcons/Paladin.png';
import warriorIcon from '../assets/jobIcons/Warrior.png';
import darkKnightIcon from '../assets/jobIcons/DarkKnight.png';
import gunbreakerIcon from '../assets/jobIcons/Gunbreaker.png';
import whiteMageIcon from '../assets/jobIcons/WhiteMage.png';
import scholarIcon from '../assets/jobIcons/Scholar.png';
import astroIcon from '../assets/jobIcons/Astrologian.png';
import sageIcon from '../assets/jobIcons/Sage.png';
import monkIcon from '../assets/jobIcons/Monk.png';
import dragoonIcon from '../assets/jobIcons/Dragoon.png';
import ninjaIcon from '../assets/jobIcons/Ninja.png';
import samuraiIcon from '../assets/jobIcons/Samurai.png';
import reaperIcon from '../assets/jobIcons/Reaper.png';
import viperIcon from '../assets/jobIcons/Viper.png';
import bardIcon from '../assets/jobIcons/Bard.png';
import machinistIcon from '../assets/jobIcons/Machinist.png';
import dancerIcon from '../assets/jobIcons/Machinist.png';
import summonerIcon from '../assets/jobIcons/Summoner.png';
import blackMageIcon from '../assets/jobIcons/BlackMage.png';
import redMageIcon from '../assets/jobIcons/RedMage.png';
import pictoIcon from '../assets/jobIcons/Pictomancer.png';
import blueMageIcon from '../assets/jobIcons/BlueMage.png';
import beastmasterIcon from '../assets/jobIcons/Beastmaster.png';

export const JOB_ICONS: Record<JobId, string> = {
  [JOB_ID.ALLROUNDER]: allrounderIcon,
  [JOB_ID.ALL_TANK]: tankIcon,
  [JOB_ID.ALL_HEAL]: healerIcon,
  [JOB_ID.ALL_MELEE]: meleeIcon,
  [JOB_ID.ALL_PRANGED]: prangedIcon,
  [JOB_ID.ALL_CASTER]: casterIcon,
  [JOB_ID.ALL_DPS]: dpsIcon,
  [JOB_ID.PLD]: paladinIcon,
  [JOB_ID.WAR]: warriorIcon,
  [JOB_ID.DRK]: darkKnightIcon,
  [JOB_ID.GNB]: gunbreakerIcon,
  [JOB_ID.WHM]: whiteMageIcon,
  [JOB_ID.SCH]: scholarIcon,
  [JOB_ID.AST]: astroIcon,
  [JOB_ID.SGE]: sageIcon,
  [JOB_ID.MNK]: monkIcon,
  [JOB_ID.DRG]: dragoonIcon,
  [JOB_ID.NIN]: ninjaIcon,
  [JOB_ID.SAM]: samuraiIcon,
  [JOB_ID.RPR]: reaperIcon,
  [JOB_ID.VPR]: viperIcon,
  [JOB_ID.BRD]: bardIcon,
  [JOB_ID.MCH]: machinistIcon,
  [JOB_ID.DNC]: dancerIcon,
  [JOB_ID.SMN]: summonerIcon,
  [JOB_ID.BLM]: blackMageIcon,
  [JOB_ID.RDM]: redMageIcon,
  [JOB_ID.PCT]: pictoIcon,
  [JOB_ID.BLU]: blueMageIcon,
  [JOB_ID.BST]: beastmasterIcon,
} as const;

export const FLEX_ICONS = {
  ALLROUNDER: allrounderIcon,
  TANK_HEAL: tankHealIcon,
  TANK_DPS: tankDpsIcon,
  HEAL_DPS: healDpsIcon,
} as const;

export function getJobIcon(jobId: JobId | undefined): string | undefined {
  if (jobId === undefined) {
    //TODO: add unknown job icon
    return '';
  }
  return JOB_ICONS[jobId];
}
