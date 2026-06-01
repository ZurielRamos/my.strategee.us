import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonIcon, 
  IonButton, 
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  folderOutline, 
  folderOpenOutline,
  keyOutline,
  createOutline,
  trashOutline,
  chevronForwardOutline,
  chevronDownOutline,
  searchOutline
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { Vault } from '../../models/vault.model';
import { CredentialListItem } from '../../models/credential.model';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { VaultFormModalComponent } from '../../components/vault-form-modal/vault-form-modal.component';
import { CredentialFormModalComponent } from '../../components/credential-form-modal/credential-form-modal.component';
import { CredentialDetailModalComponent } from '../../components/credential-detail-modal/credential-detail-modal.component';

interface TreeNode {
  id: string;
  type: 'vault' | 'credential';
  name: string;
  data: Vault | CredentialListItem;
  expanded: boolean;
  children?: TreeNode[];
  isOwner: boolean;
  depth: number;
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.page.html',
  styleUrls: ['./tree-view.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    PageHeaderComponent
  ]
})
export class TreeViewPage implements OnInit {
  treeNodes: TreeNode[] = [];
  filteredNodes: TreeNode[] = [];
  loading = false;
  searchTerm = '';
  currentEmployeeId?: string;
  
  // Context menu state
  contextMenuNode: TreeNode | null = null;
  contextMenuPosition = { x: 0, y: 0 };

  constructor(
    private vaultService: PasswordVaultService,
    private modalService: ModalService,
    private toastService: ToastService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({ 
      addOutline, 
      folderOutline, 
      folderOpenOutline,
      keyOutline,
      createOutline,
      trashOutline,
      chevronForwardOutline,
      chevronDownOutline,
      searchOutline
    });
  }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentEmployeeId = currentUser?.employeeId || undefined;
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const vaults = await firstValueFrom(this.vaultService.getVaults());
      const credentials = await firstValueFrom(this.vaultService.getCredentials());

      // Build tree structure with nested vaults
      this.treeNodes = this.buildTree(vaults, credentials);

      this.applyFilter();
    } catch (error) {
      console.error('Error loading data:', error);
      await this.toastService.error('Error al cargar los datos');
    } finally {
      this.loading = false;
    }
  }

  private buildTree(vaults: Vault[], allCredentials: CredentialListItem[]): TreeNode[] {
    // Separate root vaults (no parentId) from child vaults
    const rootVaults = vaults.filter(v => !v.parentId);
    const childVaultsMap = new Map<string, Vault[]>();

    vaults.forEach(v => {
      if (v.parentId) {
        const siblings = childVaultsMap.get(v.parentId) || [];
        siblings.push(v);
        childVaultsMap.set(v.parentId, siblings);
      }
    });

    return rootVaults
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(vault => this.buildVaultNode(vault, allCredentials, childVaultsMap, 0));
  }

  private buildVaultNode(
    vault: Vault, 
    allCredentials: CredentialListItem[], 
    childVaultsMap: Map<string, Vault[]>,
    depth: number
  ): TreeNode {
    const vaultCredentials = allCredentials
      .filter(c => c.vault.id === vault.id)
      .sort((a, b) => a.title.localeCompare(b.title));

    const children: TreeNode[] = [];

    // Add child vaults (sub-folders) first
    const childVaults = childVaultsMap.get(vault.id) || [];
    childVaults
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(childVault => {
        children.push(this.buildVaultNode(childVault, allCredentials, childVaultsMap, depth + 1));
      });

    // Then add credentials
    vaultCredentials.forEach(credential => {
      children.push({
        id: credential.id,
        type: 'credential' as const,
        name: credential.title,
        data: credential,
        expanded: false,
        isOwner: credential.ownerId === this.currentEmployeeId,
        depth: depth + 1
      });
    });

    return {
      id: vault.id,
      type: 'vault' as const,
      name: vault.name,
      data: vault,
      expanded: false,
      children,
      isOwner: vault.ownerId === this.currentEmployeeId,
      depth
    };
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredNodes = this.treeNodes;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredNodes = this.filterNodesRecursive(this.treeNodes, term);
  }

  private filterNodesRecursive(nodes: TreeNode[], term: string): TreeNode[] {
    return nodes
      .map(node => {
        const nameMatches = node.name.toLowerCase().includes(term);

        if (node.type === 'vault' && node.children) {
          const matchingChildren = this.filterNodesRecursive(node.children, term);

          if (nameMatches || matchingChildren.length > 0) {
            return {
              ...node,
              children: nameMatches ? node.children : matchingChildren,
              expanded: matchingChildren.length > 0
            };
          }
        } else if (nameMatches) {
          return node;
        }

        return null;
      })
      .filter(node => node !== null) as TreeNode[];
  }

  onSearchChange(value: string) {
    this.searchTerm = value || '';
    this.applyFilter();
  }

  toggleNode(node: TreeNode) {
    if (node.type === 'vault') {
      node.expanded = !node.expanded;
    } else {
      // Credential clicked - open detail
      this.openCredentialDetail(node.data as CredentialListItem);
    }
  }

  async openCredentialDetail(credential: CredentialListItem) {
    const result = await this.modalService.open(
      CredentialDetailModalComponent,
      { credentialId: credential.id }
    );

    if (result.role === 'refresh') {
      await this.loadData();
    }
  }

  async openCreateVaultModal(parentNode?: TreeNode) {
    const result = await this.modalService.open(
      VaultFormModalComponent,
      { 
        mode: 'create',
        parentId: parentNode?.id,
        parentName: parentNode?.name
      }
    );

    if (result.role === 'save') {
      await this.loadData();
    }
  }

  async openCreateCredentialModal(vaultNode?: TreeNode) {
    const result = await this.modalService.open(
      CredentialFormModalComponent,
      { 
        mode: 'create', 
        preselectedVaultId: vaultNode?.id
      }
    );

    if (result.role === 'save') {
      await this.loadData();
    }
  }

  async openEditVaultModal(node: TreeNode) {
    const result = await this.modalService.open(
      VaultFormModalComponent,
      { mode: 'edit', vault: node.data as Vault }
    );

    if (result.role === 'save') {
      await this.loadData();
    }
  }

  async deleteVault(node: TreeNode) {
    const vault = node.data as Vault;
    const alert = await this.alertController.create({
      header: 'Eliminar Vault',
      message: `¿Estás seguro de que deseas eliminar el vault "${vault.name}"? Solo se pueden eliminar vaults vacíos.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.vaultService.deleteVault(vault.id));
              await this.toastService.success('Vault eliminado exitosamente');
              await this.loadData();
            } catch (error: any) {
              if (error.status === 409) {
                await this.toastService.error('El vault debe estar vacío para eliminarlo');
              } else {
                await this.toastService.error('Error al eliminar el vault');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getNodeIcon(node: TreeNode): string {
    if (node.type === 'vault') {
      return node.expanded ? 'folder-open-outline' : 'folder-outline';
    }
    return 'key-outline';
  }

  getChevronIcon(node: TreeNode): string {
    return node.expanded ? 'chevron-down-outline' : 'chevron-forward-outline';
  }

  getNodeClass(node: TreeNode): string {
    return node.type === 'vault' ? 'vault-node' : 'credential-node';
  }
}
